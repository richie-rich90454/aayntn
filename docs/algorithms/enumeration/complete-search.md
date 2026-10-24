---
id: enumeration.complete-search
title: Complete search
summary: Enumerate every candidate in a finite space, test each one against the statement, and count the successes, with no pruning and no shortcuts.
division: [bronze, silver]
subjects: [enumeration]
level: introductory
importance: core-prerequisite
keywords:
    [
        complete search,
        brute force,
        exhaustive search,
        candidate space,
        baseline,
        oracle,
        subset sum,
        counting,
    ]
prerequisites:
    required: [foundations.complexity, foundations.binary-representation]
    recommended: [enumeration.subset-enumeration, enumeration.backtracking]
complexity:
    time: "O(n 2^n) for the subset contract, O(S c) for a candidate space of S candidates with a test of cost c"
    space: "O(n) for the recursion, or O(1) beyond the input for a mask loop"
assumptions:
    - The candidate space is finite and a generator visits every candidate exactly once.
    - The test is decided from the candidate alone, so the cost of one test does not hide a search.
    - The candidate count is small enough to enumerate under the time limit.
implementations: enumeration.complete-search
reviewed: false
---

## At a glance

Complete search is the technique of enumerating every candidate in a finite space, testing each one against the statement, and counting or recording the successes. It assumes nothing about the problem beyond the shape of the candidate space. Correctness is by exhaustion, and cost is the size of that space.

The technique is four decisions, and every program in this article is a different answer to the same four questions.

1. **What is a candidate?** A subset, a mask, a permutation, a pair, a triple, a grid split, or a single parameter value.
2. **How is every candidate generated once?** Binary counting, nested loops, recursion, or a library permutation routine.
3. **What representation makes the test cheapest?** A mask, an index tuple, a running sum, a difference array.
4. **What exactly is the test?** The statement's predicate, including its boundaries: equal or at most, empty subset or non-empty, positions distinct or values distinct.

The arithmetic decides whether the technique is available before any code is written.

| Candidate space                        | Count | Comfortable when  |
| -------------------------------------- | ----- | ----------------- |
| Subsets of $n$ items                   | $2^n$ | $n \le 20$        |
| Permutations of $n$ items              | $n!$  | $n \le 10$        |
| Ordered pairs of $n$ items             | $n^2$ | $n \le 5000$      |
| Ordered triples of $n$ items           | $n^3$ | $n \le 500$       |
| Assignments of $n$ items to $k$ labels | $k^n$ | small $k$ and $n$ |
| A parameter over a range of $R$ values | $R$   | $R \le 10^5$      |

The powers of two are the numbers worth memorizing. $2^{10} = 1024$, $2^{20} = 1\,048\,576$, $2^{25} = 33\,554\,432$, $2^{30} = 1\,073\,741\,824$, and $2^{40} \approx 1.1 \times 10^{12}$. At $10^8$ candidates per second with a constant-time test, $n = 20$ finishes before the program has warmed up, $n = 30$ takes about eleven seconds, and $n = 40$ takes about three hours. A test that scans the candidate multiplies those numbers by its cost.

Complete search is the baseline that the rest of this subject improves. [Subset enumeration](/algorithms/enumeration/subset-enumeration) is its mask specialization, [backtracking](/algorithms/enumeration/backtracking) removes candidates that provably cannot succeed, [meet in the middle](/algorithms/enumeration/meet-in-the-middle) reorganizes the space into two halves, and [branch and bound](/algorithms/enumeration/branch-and-bound) adds a bound to an optimization. None of those techniques is trustworthy until it agrees with a complete search on small inputs.

## Problem motivation

The contract for this topic is stated in one sentence. Read $n$ and the values with $n$ at most $20$, then read a target; count the subsets whose sum equals the target by trying every subset, and print the count.

For $n = 20$ there are $2^{20} = 1\,048\,576$ subsets. Testing one costs up to twenty additions if the sum is rebuilt from scratch, so the whole program performs about twenty-one million additions. That finishes in well under a second in C++ and in a second or two in Python. The program needs no insight into the values, no sorting, and no table. It is correct for negative values, for duplicate values, and for a target of zero.

Now change one number in the statement: $n \le 40$. The same program needs $2^{40} \approx 1.1 \times 10^{12}$ tests. Even at $10^8$ constant-time tests per second that is about three hours, and the actual test costs up to twenty additions. The judge allows one second. The code has not changed and the logic has not changed; the candidate count has. That is the whole subject of this article: **the count of candidates is the difficulty, and the program is only as good as its generator and its test.**

The counting version is the cleanest form of the contract because the output is one number. Printing every subset would also be a complete search, but then the output itself would be a million lines, and the time would be dominated by writing rather than by searching. Counting removes the output from the analysis and leaves the candidate space alone.

Two boundary cases matter and are easy to lose. The empty subset is a subset: its sum is $0$, so it counts whenever the target is $0$. And if the values may be negative, a partial sum above the target can come back down, so the tempting prune "stop when the running sum exceeds the target" is wrong. The statement does not restrict the signs, so the reference programs do not prune at all.

## Recognition patterns

Complete search is the right tool when the statement itself makes the candidate space small, or when the problem is being used as a baseline.

- **The bound names the objects.** "At most 20 items", "at most 10 switches", "a permutation of at most 8 letters", "$n \le 100$ and consider every pair".
- **A candidate can be named by a small tuple.** A mask, an index, a pair, a triple, a split coordinate, a target height.
- **The test is a direct comparison.** Sum, product, distance, count, or a per-cell check that reads the candidate and constant-size data.
- **There is no exchange argument and no optimal substructure in sight.** Greedy and dynamic programming have nothing to grab.
- **A reference answer is needed.** A complete search is the oracle used to stress-test the fast solution on small random inputs.

The phrases that signal the technique are "try all", "for every", "count the ways", "enumerate", and any constraint below about 25. The phrase that rules it out is a bound in the hundreds of thousands combined with a question about the whole set.

The table below is the decision in numbers.

| Candidate space | Count at the largest allowed input | Verdict |
| --- | --- | --- |
| Subsets, $n = 20$ | $1\,048\,576$ | Complete search is enough |
| Subsets, $n = 25$ | $33\,554\,432$ | Feasible with a cheap test |
| Subsets, $n = 30$ | $1\,073\,741\,824$ | Too many for a per-candidate scan |
| Subsets, $n = 40$ | $1.1 \times 10^{12}$ | Split the space, or use a polynomial method |
| Permutations, $n = 10$ | $3\,628\,800$ | Complete search is enough |
| Permutations, $n = 12$ | $479\,001\,600$ | Usually too many |
| Triples, $n = 500$ | $1.25 \times 10^8$ | On the edge; the test must be constant time |
| Parameter range, $R = 101$ | $101$ | A linear scan per value is fine |

Complete search is also the wrong tool in three situations that are easy to misread.

- **The test needs a search of its own.** If deciding one candidate costs $O(n)$, the real cost is the product $S \cdot n$, not $S$. This is where a brute force quietly becomes quadratic on top of being exponential.
- **The candidates are not finite in the model.** A real-valued parameter, an unbounded length, or a path that may repeat vertices has no honest enumeration until a bound or a normalization is proved.
- **The statement gives structure that a polynomial method can use.** If the values are non-negative and the target is small, the [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) table is polynomial and the search is unnecessary. If the answer is a count of arrangements, [binomial coefficients](/algorithms/combinatorics/binomial-coefficients) may replace the enumeration.

## Naive approach

The baseline enumerates masks and rebuilds each subset's sum from scratch.

```python
def count_subsets(values, target):
    total = 0
    for mask in range(1 << len(values)):
        running = 0
        for index, value in enumerate(values):
            if (mask >> index) & 1:
                running += value
        if running == target:
            total += 1
    return total
```

This is correct for every finite list of integers and every target. It costs $n 2^n$ additions plus $2^n$ comparisons. At $n = 20$ that is about twenty-one million additions, which is a fraction of a second in C++ and a couple of seconds in Python.

The second baseline materializes every subset before testing it.

```python
from itertools import combinations

def count_subsets(values, target):
    total = 0
    for size in range(len(values) + 1):
        for subset in combinations(values, size):
            if sum(subset) == target:
                total += 1
    return total
```

This is also correct, and it is worse in two ways. It allocates a tuple per subset, and it resums the tuple from scratch, so the cost is still $O(n 2^n)$ with a much larger constant and $O(n 2^n)$ total allocation over the run. The mask loop keeps the same candidate count with no allocation at all.

The third baseline is the recursive one that passes the running sum down the call chain.

```python
def count_subsets(values, target):
    def search(index, running):
        if index == len(values):
            return int(running == target)
        return search(index + 1, running) + search(
            index + 1, running + values[index]
        )

    return search(0, 0)
```

It performs one addition per edge instead of one addition per selected item per mask, so its cost is $O(2^n)$ rather than $O(n 2^n)$, at the price of $O(n)$ stack. This is the form the six reference programs use, because the include-or-skip decision is the clearest possible statement of what a complete search does.

The naive version is not a strawman to be discarded. It is the specification of the answer, the oracle for differential testing, and the fallback when the intended solution is wrong. Write it first, keep it, and only then decide whether the candidate count needs a better technique.

## Key insight

A complete search rests on two obligations, and they are both about the generator rather than about the problem.

1. **Coverage.** Every candidate in the space is generated at least once.
2. **Uniqueness.** No candidate is generated more than once.

If a generator satisfies both, it is a bijection between the integers $0, \ldots, S - 1$ and the candidate space $C$. Then counting the indices whose candidate passes the statement's predicate counts exactly the candidates that pass, because each candidate appears at exactly one index. No property of the predicate is used. That is why the technique is trustworthy even when the problem is not understood: the only claim that needs proof is a claim about the loop bounds.

Pruning is the opposite trade. A pruned search stops generating a whole subtree, so it must prove that no candidate in that subtree can pass. A wrong proof removes solutions silently, and the program still prints a number. Complete search refuses to make that claim. It is slower, and it is the only version whose correctness can be checked by reading the generator alone.

The same idea explains why complete search is the standard oracle. Suppose a greedy or dynamic program prints an answer. On small inputs, run both programs. A disagreement is a counterexample to one of them, and the complete search is the one whose answer can be verified by counting on paper. The cost of the oracle is the small input, which is exactly where the exponential search is cheap.

The test must be as precise as the generator. "At most the target" and "equal to the target" differ at the boundary; "a subset" includes the empty subset; "two subsets" may mean two index sets or two distinct value multisets. Those choices belong in the test, not in an after-the-fact correction to the count.

## Visual intuition

Take values $[1, 2, 3]$ and target $3$. The candidate space is the eight masks, and the table below is the entire algorithm.

```text
mask  subset     sum  equals 3?
000   {}          0      no
001   {1}         1      no
010   {2}         2      no
011   {1,2}       3      yes
100   {3}         3      yes
101   {1,3}       4      no
110   {2,3}       5      no
111   {1,2,3}     6      no
```

Eight rows, two successes, answer $2$. The mask is the address of the candidate, the subset is its content, and the sum is the test. Reading the table from top to bottom is a complete search: binary counting visits every address in $[0, 8)$ exactly once, so no row is skipped and no row appears twice.

The recursive form draws the same eight rows as the leaves of a tree.

```text
                          {}
                   take 1 /  \ skip 1
                        {1}    {}
                 take 2 / \    / \ skip 2
                   {1,2} {1} {2}  {}
             take 3 / \   / \  / \   / \
       leaves: {1,2,3} {1,2} {1,3} {1} {2,3} {2} {3} {}
```

Every internal node is a prefix decision, and every leaf is one complete candidate. A complete search visits every internal node and every leaf. [Backtracking](/algorithms/enumeration/backtracking) removes whole subtrees from this picture, and [meet in the middle](/algorithms/enumeration/meet-in-the-middle) splits the leaves into two groups that are enumerated separately.

The picture also shows why the empty subset is not an exception. It is the leaf reached by taking the skip edge at every level, so it is generated by the same loop as every other candidate. A program that starts its mask loop at $1$ removes exactly that leaf.

## Formal model

Let $A = (a_0, a_1, \ldots, a_{n-1})$ be the values and let $T$ be the target. A mask is an integer $m$ with $0 \le m < 2^n$. Bit $i$ of $m$ is $1$ exactly when item $i$ is chosen, and

$$
\sigma(m) = \sum_{i=0}^{n-1} m_i \, a_i,
$$

where $m_i$ is the $i$-th bit of $m$. The answer is the cardinality of the set of masks whose sum is the target:

$$
\text{answer} = \bigl|\{\, m \in [0, 2^n) : \sigma(m) = T \,\}\bigr|.
$$

::: math definition Definition
A **candidate space** is a finite set $C$ together with a predicate $P : C \to \{\text{true}, \text{false}\}$ that encodes the statement. A **generator** is a bijection $g : \{0, 1, \ldots, |C| - 1\} \to C$.
:::

::: math definition Definition
A **complete search** computes

$$
\sum_{i=0}^{|C|-1} [\,P(g(i))\,],
$$

where $[\,P\,]$ is $1$ when $P$ holds and $0$ otherwise.
:::

For the subset contract, $C = [0, 2^n)$, the bijection is the identity on masks, and $P(m)$ is $\sigma(m) = T$.

::: math lemma Lemma
If $g$ is a bijection and $P$ is the statement's predicate, the complete search returns exactly $|\{\, c \in C : P(c) \,\}|$.
:::

::: math invariant Invariant
After the first $k$ candidates have been processed, the counter equals

$$
\bigl|\{\, i < k : P(g(i)) \,\}\bigr|.
$$

At $k = |C|$ the invariant states the answer.
:::

The bits of a mask and the subsets of an $n$-item set are in bijection by the binary representation: the mask $m$ corresponds to the subset of indices whose bit is set, and every subset has exactly one such mask. This is the coverage and uniqueness argument in its smallest form.

## Algorithm derivation

The mask form is two nested loops.

```text
read n
read a[0 .. n - 1]
read T

answer = 0
for mask = 0 to 2^n - 1:
    running = 0
    for i = 0 to n - 1:
        if bit i of mask is set:
            running = running + a[i]
    if running == T:
        answer = answer + 1

print answer
```

The outer loop is the generator and the inner loop is the test. Their costs multiply: $2^n$ candidates times $n$ additions. The recursive form removes the inner loop by carrying the running sum.

```python
def search(index, running):
    if index == n:
        return int(running == target)
    skip = search(index + 1, running)
    take = search(index + 1, running + values[index])
    return skip + take
```

The two forms are the same enumeration in different orders. The recursion fixes the decisions in index order; the mask loop fixes them in binary counting order. Both visit every subset once. The recursion performs one addition per take edge and one comparison per leaf, so its cost is $O(2^n)$; the mask loop performs one addition per set bit, which sums to $n 2^{n-1}$ additions over all masks.

The recursion is also the clearer place to see what a prune would do. A prune would replace one of the two calls with a test that stops the branch. That test is a claim about all completions of the current prefix. For the subset contract no such claim is available, because a negative value can move a running sum toward the target after it has passed it. The complete search keeps both calls and makes no claim.

The input order follows the contract: $n$, then the $n$ values, then the target. A token-based reader is the simplest way to accept the three lines, and it makes the line breaks irrelevant.

::: math invariant Invariant
At a call of `search(index, running)`, `running` equals the sum of the values whose take edges lie on the path from the root to this call, and the subtree below the call has exactly one leaf per assignment of the remaining $n - index$ decisions.
:::

## Step-by-step execution

Take $n = 4$, values $[1, 2, 3, 4]$, and target $5$. The values are indexed from $0$, and bit $i$ of the mask selects value $a_i$.

| Mask | Subset           | Sum  | Equals $5$ |
| ---- | ---------------- | ---- | ---------- |
| $0$  | $\varnothing$    | $0$  | no         |
| $1$  | $\{1\}$          | $1$  | no         |
| $2$  | $\{2\}$          | $2$  | no         |
| $3$  | $\{1, 2\}$       | $3$  | no         |
| $4$  | $\{3\}$          | $3$  | no         |
| $5$  | $\{1, 3\}$       | $4$  | no         |
| $6$  | $\{2, 3\}$       | $5$  | yes        |
| $7$  | $\{1, 2, 3\}$    | $6$  | no         |
| $8$  | $\{4\}$          | $4$  | no         |
| $9$  | $\{1, 4\}$       | $5$  | yes        |
| $10$ | $\{2, 4\}$       | $6$  | no         |
| $11$ | $\{1, 2, 4\}$    | $7$  | no         |
| $12$ | $\{3, 4\}$       | $7$  | no         |
| $13$ | $\{1, 3, 4\}$    | $8$  | no         |
| $14$ | $\{2, 3, 4\}$    | $9$  | no         |
| $15$ | $\{1, 2, 3, 4\}$ | $10$ | no         |

Sixteen candidates are generated, and the counter is incremented twice, at masks $6$ and $9$. The table is worth reading at its ends. Mask $0$ is generated first and is the empty subset, whose sum is $0$ and which fails the test. Mask $15$ is generated last and is the full set. A loop written as `range(1, 1 << n)` would drop the first row; a loop written as `range(1 << n)` keeps it, and the two programs differ whenever the target is $0$.

The recursive trace of the two successes is short. At mask $6$, the path takes value $2$ and value $3$ and skips $1$ and $4$. At mask $9$, the path takes $1$ and $4$ and skips $2$ and $3$. The other fourteen leaves are reached as well, and each of them compares its running sum once. There is no early exit: a program that stopped at mask $6$ would print $1$, not $2$.

## Correctness proof

::: math theorem Theorem
The program prints exactly the number of subsets of the input whose sum equals the target.
:::

::: math proof Proof
**The generator is a bijection.** The binary representation maps every integer $m$ with $0 \le m < 2^n$ to exactly one $n$-bit string, and every $n$-bit string is the representation of exactly one such integer. Reading bit $i$ as "item $i$ is chosen" turns each string into exactly one subset of the $n$ items, and every subset arises from exactly one string. The composition is therefore a bijection between the masks and the subsets.

**The test is exact.** For a mask $m$, the inner loop adds $a_i$ exactly when bit $i$ of $m$ is set, so the value of `running` after the loop is $\sigma(m)$, the sum of the chosen items. The comparison `running == target` is true exactly when that sum equals $T$.

**The counter is exact.** The counter starts at $0$ and is incremented exactly on the masks whose test is true. Because the generator visits each mask once, each qualifying subset contributes exactly once, and no other subset contributes. By the lemma, the final counter is the cardinality of the qualifying set.

**The recursive form agrees.** Induct on `index`. For `index = n` there are no decisions left, the only leaf below the call is the current prefix, and the returned value is $1$ exactly when its sum is $T$. For `index < n`, every completion either skips item `index` or takes it, the two sets of completions are disjoint and together cover all completions, and the two recursive calls return their counts. Their sum is therefore the count below the current call. At the root the count is the answer. Termination is immediate because `index` increases on every call and is bounded by $n$. $\square$
:::

::: math proof Proof
The state invariant holds at the root, where the path is empty and `running = 0`. If it holds at a call, the skip call keeps the running sum and adds no edge to the path, and the take call adds $a_{\text{index}}$ and one take edge, so it holds at both children. By induction it holds at every call. $\square$
:::

The proof uses no property of the values. They may be negative, zero, repeated, or unsorted, and the theorem still holds, because the generator and the test never look at anything except the bits and the values. This is the formal content of the claim that complete search is correct by exhaustion rather than by insight.

One assumption sits outside the proof: the arithmetic must not overflow. With $n \le 20$ and $|a_i| \le 10^9$, every partial sum and the total lie between $-2 \cdot 10^{10}$ and $2 \cdot 10^{10}$, which fits comfortably in a signed 64-bit integer. A 32-bit accumulator would wrap, and a wrapped sum can equal the target by accident. The reference programs use 64-bit sums.

## Complexity analysis

**The mask loop.** The outer loop runs $2^n$ times. The inner loop runs $n$ times for every mask, and the number of additions is the total number of set bits over all masks, which is $n 2^{n-1}$. Including the comparisons, the cost is $\Theta(n 2^n)$ elementary operations. The extra space is $O(1)$ beyond the input array.

**The recursion.** The tree has $2^{n+1} - 1$ calls: $2^n$ leaves and $2^n - 1$ internal nodes. Each call does constant work, so the time is $\Theta(2^n)$ and the stack is $O(n)$. This is the faster form when the test is the sum itself, because the sum is maintained incrementally.

**The general form.** For a candidate space of size $S$, a generator that costs $g$ per candidate, and a test that costs $c$ per candidate, the time is $O(S(g + c))$ and the space is the generator's recursion depth plus the test's working storage. The number that decides feasibility is $S$, not the constant factor, because $S$ grows exponentially in the parameters that define the space.

The table converts the formula into a decision at $10^8$ simple operations per second.

| $n$  | Candidates $2^n$     | Additions (at most)  | C++             | Python               |
| ---- | -------------------- | -------------------- | --------------- | -------------------- |
| $10$ | $1\,024$             | $10\,240$            | Instant         | Instant              |
| $15$ | $32\,768$            | $491\,520$           | Instant         | Instant              |
| $20$ | $1\,048\,576$        | $20\,971\,520$       | Under $0.1$ s   | About $1$ s          |
| $22$ | $4\,194\,304$        | $92\,274\,688$       | About $0.2$ s   | A few seconds        |
| $25$ | $33\,554\,432$       | $838\,860\,800$      | About $1$ s     | Too slow             |
| $30$ | $1\,073\,741\,824$   | $32\,212\,254\,720$  | Tens of seconds | Far too slow         |
| $40$ | $1.1 \times 10^{12}$ | $4.4 \times 10^{13}$ | Hours           | Not a contest option |

The constants are worth one sentence. The mask loop reads the values array directly and has no call overhead; the recursion makes two calls per internal node and pays for them. In C++ the difference is small at $n = 20$. In Python the recursive form is several times slower than the iterative mask loop, which is why the language matters when the candidate count is near the limit.

The answer itself fits easily: it is at most $2^{20} = 1\,048\,576$, so a 32-bit counter is enough for this contract. A general complete search may have a candidate space larger than $2^{31}$, in which case the counter must be 64-bit as well. The sums are the quantity that forces 64-bit arithmetic here.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $n \le 20$, count the subsets that satisfy a test | Complete search with a mask |
| $n \le 20$, list every subset | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| The choices depend on earlier choices, and a prune can be proved | [Backtracking](/algorithms/enumeration/backtracking) |
| $n \le 40$ and the condition splits into two halves | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle) |
| An optimization with a safe upper or lower bound | [Branch and bound](/algorithms/enumeration/branch-and-bound) |
| Every ordering of at most ten items | [Permutations](/algorithms/enumeration/permutations) |
| The values are non-negative and the target is small | [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) |
| The candidate is one parameter over a small range | Complete search over the range |
| The test itself needs a search | Reformulate until the test is constant time |
| $n$ is large and a formula exists | A closed form, not an enumeration |

The first row is the technique of this article, and the second row is its most common special case. The distinction between them is representational rather than mathematical: subset enumeration names candidates by masks, while complete search names them by whatever the statement provides. When the candidates are pairs or triples, the mask is not available and the nested loops are the generator.

The row that decides most contests is the third. Backtracking is complete search plus a proof that some candidates cannot succeed. If the proof is not available, the pruning is a guess, and a guess that removes a valid candidate produces a wrong count that looks like a right one. The safe order is always: write the complete search, prove the prune on paper, then add it and compare the two answers on random small inputs.

The dynamic-programming row is the other common upgrade. A subset-sum count with small non-negative weights is a knapsack table, and the table replaces $2^n$ by $nW$. The complete search is still useful as the oracle that checks the table's indexing on small cases.

## Reference implementations

The manifest publishes six `program` variants, one per language: C, C++17, Java, Python, Pascal, and JavaScript. There is no reusable minimal variant, because the algorithm is short enough that the whole program is the reference. Each file reads the same input, performs the same include-or-skip recursion, and prints the same line.

The contract is fixed across all six files.

- **Input:** $n$ on the first line, the $n$ values on the next line, the target on the last line.
- **Output:** one integer on one line, the number of subsets whose sum equals the target.
- **Assumptions:** $0 \le n \le 20$, $|a_i| \le 10^9$, $|T| \le 2 \cdot 10^{10}$, and the empty subset is counted.

The language-specific choices are narrow. C uses `scanf` with `%d` and `%lld`, a static array of twenty `long long` values, and a recursive `search` that carries the running sum. C++17 uses `std::cin`, a `std::vector<long long>`, and a recursive function that returns a `long long` count. Java uses `Scanner`, a `long[]`, and a private static recursive method inside `class Main`, with the file named `Main.java`. Python reads all tokens from `sys.stdin.buffer`, keeps arbitrary-precision integers, and returns the count from a recursive function. Pascal uses `Int64`, one `Read` argument per value, and `IntToStr` from `SysUtils`. JavaScript reads the whole input with `readFileSync(0)`, parses with `Number`, and recurses over the array.

All six are marked `unverified` until the validation job compiles them and compares their output on the shared fixtures. The C, C++, Java, and Pascal versions use 64-bit integers for the running sums; Python integers and JavaScript `Number` are exact at these bounds, because every intermediate value is far below $2^{53}$.

## Recursion decision

The depth is at most $20$, so the recursive form is safe in every language in this encyclopedia.

| Language   | Default stack              | Practical depth         | Verdict for depth $20$ |
| ---------- | -------------------------- | ----------------------- | ---------------------- |
| C and C++  | 8 MB on Linux              | About $10^5$ frames     | Recursion is safe      |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Recursion is safe      |
| Python     | Interpreter limit of 1000  | 1000 frames             | Recursion is safe      |
| Pascal     | The operating system stack | Depends on the platform | Recursion is safe      |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Recursion is safe      |

The recursion is not needed for the stack reason; it is chosen for the shape. The two calls in the body are the two definitions of "all completions": skip the item, or take it. That is exactly the coverage argument, and it is harder to see in a mask loop. At $n = 20$ the recursive form makes $2^{21} - 1 \approx 2.1$ million calls, while the mask loop performs about one million iterations, so the iterative form is the faster one when speed is the only criterion.

The recursion needs no restore step because the running sum is passed by value. If the running sum were a global variable, the take branch would have to add and then subtract on the way back; forgetting the subtraction would corrupt every sibling branch. Passing the parameter is shorter and removes the class of bug entirely.

An explicit stack would be the third form, and it is worth writing only when the depth exceeds the language's limit. Here the limit is three orders of magnitude away, so it is not.

## Implementation walkthrough

Three details decide whether the program is right.

**The input order.** The first token is $n$, the next $n$ tokens are the values, and the token after them is the target. A program that reads $n$ and the target first will shift every value by one position, and the failure is silent because the program still prints a number. Token-based reading is safer than line-based reading, because the values may be spread over several lines even though the contract shows them on one.

**The base case.** The recursion must compare the running sum when no decisions remain, and it must do so for every leaf, not only for the first one.

```cpp
long long search(int index, long long running) {
    if (index == n) {
        return running == target ? 1 : 0;
    }
    return search(index + 1, running)
         + search(index + 1, running + values[index]);
}
```

There is no early return at a match. A `return 1` when `running == target` would count the first qualifying leaf and skip its siblings, and the answer would be $1$ on every input with at least one match. The count is a sum over leaves, not a search for one leaf.

**The width of the sum.** Twenty values of magnitude $10^9$ reach $2 \cdot 10^{10}$, which is larger than a signed 32-bit integer. The running sum, the target, and any subtraction must be 64-bit. The count itself is at most $2^{20}$ and fits in 32 bits, but keeping it in the same 64-bit type costs nothing and avoids a conversion mistake when the same code is reused for a larger space.

The language notes are short. In Java, the class must be named `Main` and the file `Main.java`, with no package declaration. In Python, `sys.stdin.buffer.read().split()` handles arbitrary whitespace and negative signs. In Pascal, every `Read` takes exactly one argument and the program avoids `IOResult`, which is not available in the browser compiler; `IntToStr` comes from `SysUtils`. In JavaScript, `Number` is exact for every integer below $2^{53}$, so the sums and the count are exact, and the recursive function is written with plain arithmetic rather than 32-bit bitwise operators.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Starting the mask loop at $1$ | The empty subset is never tested | Start at $0$ |
| Reading the target before the values | Every value is shifted by one position | Read $n$, the values, then the target |
| Pruning a running sum with negative values | Valid subsets are discarded | Do not prune without a proof about signs |
| Returning at the first match | The count is $1$ or $0$ | Accumulate every match |
| Rebuilding the subset inside the test | The constant factor is $n$ times too large | Pass the running sum down |
| Deduplicating equal subsets | Duplicate positions are distinct candidates | Count masks or index sets, not value multisets |
| Using a 32-bit running sum | Large weights wrap and compare equal by accident | Use 64-bit for every sum |
| Writing `1 << n` for large $n$ | Undefined behavior in C and C++, overflow in Java | Bound $n \le 20$, or use a 64-bit shift |
| Testing "at most" when the statement says "equal" | The answer is off by the boundary cases | Copy the inequality from the statement |
| Mutating a shared sum without restoring it | Later leaves see the wrong prefix | Pass the sum by value |

### Why this fails: the empty subset that is never generated

The plausible wrong approach is to reason that the empty subset is not interesting and to start the loop at $1$.

```python
for mask in range(1, 1 << n):
    ...
```

The smallest case that exposes the bug is $n = 1$, values $[0]$, target $0$. The correct answer is $2$: the empty subset and the singleton both sum to $0$. The buggy loop generates only mask $1$ and prints $1$. With $n = 0$ the correct answer is $1$ and the buggy loop prints $0$, because the loop body never runs.

The failure is silent, and on this contract it shows only when the target is $0$, which is exactly the case a careless test set omits. On the contract's own fixture with values $[1, 2, 3, 4]$ and target $5$, the empty subset does not match, so the bug does not show. A test set that never has target $0$ will never catch it. The fix is one character: start at $0$, or let the recursion's base case handle the empty leaf.

### Why this fails: the prune that assumed positive values

The second plausible wrong approach is to add the prune "if the running sum is already greater than the target, stop". With positive values it is sound, because adding more positive values only increases the sum. The contract does not promise positive values.

Take values $[-5, 5]$, target $0$. The correct answer is $2$: the empty subset and the pair $\{-5, 5\}$. Suppose the recursion takes $5$ first. The running sum is $5$, which is greater than the target, so the prune cuts the branch before $-5$ is considered. The program prints $1$.

The mechanism is exact: the prune treats the running sum as monotone, and a negative value makes it non-monotone. The same failure appears in a mask loop that skips masks whose partial sum has passed the target, and in a greedy that sorts the values and stops early. The lesson is not "never prune"; it is that a prune is a theorem about the instance, and the theorem must be proved from the constraints rather than from the sample.

## Variants and extensions

- **Include-or-skip recursion.** The form used by the reference programs. One call per decision, one addition per take edge, $O(2^n)$ time and $O(n)$ stack.
- **Mask loop.** The iterative form. It uses no stack and visits candidates in binary order, which makes the mask itself available for reconstructing the subset or for indexing a table.
- **Gray-code order.** Consecutive masks differ in one bit, so the running sum is updated with one addition or one subtraction per candidate. The enumeration becomes $O(2^n)$ with a very small constant, at the cost of the Gray-code generator. The technique is the subject of [Gray codes](/algorithms/enumeration/gray-codes).
- **Meet in the middle.** Split the items, enumerate the subsets of each half, and combine the two lists. This is the upgrade when $n$ is between about 25 and 40 and the test is additive. The full derivation is in [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
- **Backtracking.** Add a prune that is proved to reject only infeasible prefixes. This is the upgrade when the statement supplies a monotone constraint.
- **Branch and bound.** Add a bound to an optimization and abandon a branch when its best possible completion cannot beat the best found. The bound must be admissible.
- **Permutation enumeration.** When the candidate is an ordering, `next_permutation` or a recursive swap loop generates the $n!$ candidates. The subject is [permutations](/algorithms/enumeration/permutations).
- **Nested loops.** Pairs and triples are complete search over index tuples. The loop bounds are the generator, and the body is the test.
- **Parameter sweep.** When the candidate is a single number, such as a target height or a split coordinate, the space is a range of integers and the test scans the input.
- **Symmetry reduction.** If two candidates are proved to have the same answer, enumerate one representative and multiply. The proof is mandatory; without it the reduction is a guess.
- **Randomized search.** Sampling candidates is not complete search, because it can miss the answer. It is useful for finding a witness quickly, never for an exact count.
- **Oracle testing.** Run the complete search and the fast solution on the same small random inputs and compare. This is the most valuable use of the technique in a contest.

## Contest strategy

1. **Count the candidates before writing code.** If the count is above $10^8$, the complete search is a baseline rather than the final answer.
2. **Write the brute force first.** It is the specification, the oracle, and the fallback. Keep it in a separate file or function.
3. **Name the candidate in one sentence.** "A candidate is a mask of the items I take." If the sentence is vague, the generator will be vague too.
4. **Name the test in one sentence.** Copy the inequality and the boundary conditions from the statement.
5. **Check the degenerate inputs.** $n = 0$, one item, all values zero, target zero, no match, every subset matches, negative values.
6. **Time the largest input.** A program that is fast on the sample proves nothing about the bound.
7. **Upgrade along the table, not by micro-optimizing.** Pruning, splitting, or a polynomial method changes the exponent; a faster loop does not.
8. **Stress-test the fast solution against the brute force.** Random small cases, then structured cases: duplicates, negatives, target at the boundary, all equal.
9. **Do not prune without a proof.** A wrong prune is a wrong answer; a slow complete search is a time-limit verdict, which is easier to diagnose.
10. **Read the input format literally.** The order of $n$, the values, and the target is part of the contract.

## Worked problems

### Problem 1: Apple Division

**Restatement.** This is [CSES Apple Division](https://cses.fi/problemset/task/1623): given $n \le 20$ weights $p_i \le 10^9$, divide the apples into two groups so that the difference between the group weights is minimal.

**Naive baseline.** Enumerate all $2^n$ subsets for the first group, sum each group, and take the minimum difference. This is correct and costs $O(n 2^n)$ if each group is summed from scratch.

**Insight.** A division is determined by the subset that goes into the first group; the second group is its complement. So the candidate is a subset, and its test is a single number: the difference between the subset's sum and the rest.

**Derivation.** Read the total weight $P$. For each mask, compute the sum $s$ of the chosen weights. The other group has weight $P - s$, so the difference is $|P - 2s|$. Keep the minimum over all masks. The empty subset and the full subset are both candidates and both give difference $P$.

**Correctness.** Every division of the apples corresponds to exactly one subset, because the first group determines the second. The expression $|P - 2s|$ is exactly the difference of the two group weights. Minimizing over all subsets therefore minimizes over all divisions.

**Complexity.** $O(n 2^n)$ time and $O(1)$ extra space beyond the input. At $n = 20$ that is about twenty-one million additions. The total weight reaches $2 \cdot 10^{10}$, so the total and the running sum need 64 bits.

**Common wrong approach.** Sorting the weights and alternately placing the largest remaining apple into the lighter group. The greedy is not optimal: on $[8, 7, 6, 5, 4]$ it ends with the groups $17$ and $13$, a difference of $4$, while the split $8 + 7$ against $6 + 5 + 4$ has difference $0$. The complete search is the honest answer at this bound.

### Problem 2: Air Cownditioning II

**Restatement.** This is [USACO 2023 January Bronze, Air Cownditioning II](https://usaco.org/index.php?page=viewproblem2&cpid=1276): $N \le 20$ cows occupy disjoint stall intervals and require $c_i$ units of cooling; $M \le 10$ air conditioners each cool an interval by $p_i$ at cost $m_i$. Choose a subset of conditioners of minimum total cost so that every stall meets its cow's requirement.

**Naive baseline.** Enumerate all $2^M$ subsets of conditioners. For each subset, build an array of $100$ stall temperatures, add the cooling of every chosen unit to every stall in its range, and check every cow's interval. That is $O(2^M (100M + N))$, and at $M = 10$ it is at most about one million operations.

**Insight.** The number of conditioners is ten, so the choice is a small subset, not a large assignment. The test is a small sweep over one hundred stalls, and the objective is additive over the chosen units.

**Derivation.** For each mask from $0$ to $2^M - 1$, initialize a difference array over the stalls. For every chosen conditioner, add $p_i$ at $a_i$ and subtract it after $b_i$. Prefix-sum the array, then check every cow's interval against its requirement. If every cow's requirement is met, compare the subset's cost with the best cost so far.

**Correctness.** The subsets of conditioners are in bijection with the choices of which units run, and the difference array computes exactly the sum of the powers that cover each stall. The check is therefore exact for the subset, and the minimum over all subsets is the minimum over all valid choices. The statement guarantees that running every unit is feasible, so the answer is well defined.

**Complexity.** $O(2^M (M + 100 + N))$ time and $O(100)$ extra space. At $M = 10$ the outer loop has $1024$ iterations.

**Common wrong approach.** Greedily taking the conditioner with the best cooling per unit cost. Overlapping ranges mean that a cheap unit can be redundant once another unit covers the same stalls, and an expensive unit can be necessary for a stall that nothing else reaches. The complete search is small enough that the greedy is not worth the risk.

### Problem 3: Ski Course Design

**Restatement.** This is [USACO 2014 January Bronze, Ski Course Design](https://usaco.org/index.php?page=viewproblem2&cpid=376): $N \le 1000$ hills have elevations between $0$ and $100$. Change heights at a cost of $x^2$ for a change of $x$ so that the difference between the highest and lowest hill is at most $17$, and minimize the cost.

**Naive baseline.** The final interval could start at any real number, but the heights are integers, so it is enough to try every integer lowest height $L$ from $0$ to $83$. For each $L$, move every hill below $L$ up to $L$ and every hill above $L + 17$ down to $L + 17$, and sum the squared changes.

**Insight.** Once the final interval $[L, L + 17]$ is fixed, the cheapest change for each hill is to the nearest endpoint, because the cost is convex and the feasible set is the interval. The only remaining choice is $L$, and its range is $84$ values.

**Derivation.** For $L = 0, 1, \ldots, 83$, compute the cost of every hill: $0$ inside the interval, $(L - h)^2$ below it, and $(h - L - 17)^2$ above it. Sum the costs and keep the minimum. The upper limit $83$ is the largest $L$ whose interval still ends at $100$, the largest possible elevation.

**Correctness.** Any valid final arrangement has all heights in some interval $[a, a + 17]$ with $a \le 83$, because the maximum height is at most $100$; if $a > 83$, the interval $[83, 100]$ already contains every possible height and costs no more. So the enumeration includes an optimal interval. For a fixed $L$, moving a hill to the nearest endpoint is optimal because the squared distance increases as the final height moves away from the original. The minimum over all $L$ is therefore the answer.

**Complexity.** $O(84 N)$ time and $O(1)$ extra space, which is about eighty-four thousand operations at $N = 1000$. The answer is at most $1000 \cdot 100^2 = 10^7$, so a 32-bit integer is enough.

**Common wrong approach.** Trying only the original elevations as the interval's endpoints. The optimal interval endpoint can be a height that no hill has, and the enumeration over all $84$ values is what covers it.

## Practice progression

1. **Recognition.** For each problem you meet this week, write down the candidate space and its size before writing any code. If the size is a power of two, say which parameter is in the exponent.
2. **Direct application.** Implement the subset-sum count in your contest language. Verify it by hand on $n = 3$ with target $0$ and with negative values, then against the mask loop on random inputs.
3. **Adaptation.** Solve Apple Division by changing only the test: keep a minimum of $|P - 2s|$ instead of a count of matches. The generator and the recursion do not change.
4. **Combination.** Solve Air Cownditioning II. The candidate is still a subset, but the test now scans one hundred stalls, so the cost is the product of the candidate count and the test cost.
5. **Challenge.** Solve Ski Course Design, where the candidate is a single parameter rather than a subset. Then solve a problem with both a subset and a scan, and count the operations before coding.
6. **Transfer.** Take a fast solution you have already written, write its complete-search version, and stress-test the two on random small inputs. The exercise is the most reliable way to find the boundary cases that the fast solution mishandled.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four decisions every complete search makes? (At a glance)
2. What two obligations must the generator satisfy, and why do they imply correctness? (Key insight)
3. What does the mask-to-subset bijection say, and which part of the proof uses it? (Correctness proof)
4. Why is the empty subset generated by the same loop as every other subset? (Visual intuition)
5. In the sixteen-mask trace, which masks match, and would a loop starting at $1$ change the answer on that input? (Step-by-step execution)
6. What is the cost of the mask loop, and what is the cost of the include-or-skip recursion? (Complexity analysis)
7. Why is pruning a running sum unsound when values may be negative? (Common mistakes)
8. When should the complete search be replaced by meet in the middle, and when by a dynamic program? (Algorithm selection)
9. Why are the reference programs recursive rather than iterative, and why is the recursion safe at $n = 20$? (Recursion decision)
10. What is the input order, and what happens if the target is read before the values? (Implementation walkthrough)
11. In Apple Division, why does every subset determine a division, and what is the difference formula? (Worked problems)
12. Why is the candidate count the number that decides feasibility, rather than the constant factor? (Complexity analysis)

## Further reading

- The mask specialization of this technique, including the bit operations and the materialized subsets, is [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The upgrade that removes provably hopeless branches is [backtracking](/algorithms/enumeration/backtracking); the version with an admissible bound is [branch and bound](/algorithms/enumeration/branch-and-bound).
- The split that makes $n$ up to about forty affordable is [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
- The ordering variant is [permutations](/algorithms/enumeration/permutations), and the one-bit-at-a-time ordering that makes the running sum $O(1)$ per candidate is [Gray codes](/algorithms/enumeration/gray-codes).
- The polynomial replacement for a small non-negative target is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The cost arithmetic that decides whether a candidate space fits is in [complexity](/algorithms/foundations/complexity), and the mask representation is in [binary representation](/algorithms/foundations/binary-representation).
- The logarithmic query that a sorted list supports is in [binary search](/algorithms/searching/binary-search), and the linear combine of two sorted lists is in [two pointers](/algorithms/arrays/two-pointers).
- The exercises are [CSES Apple Division](https://cses.fi/problemset/task/1623), [USACO 2023 January Bronze, Air Cownditioning II](https://usaco.org/index.php?page=viewproblem2&cpid=1276), and [USACO 2014 January Bronze, Ski Course Design](https://usaco.org/index.php?page=viewproblem2&cpid=376).
