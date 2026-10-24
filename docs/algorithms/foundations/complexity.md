---
id: foundations.complexity
title: Complexity analysis
summary: Describe how the work of an algorithm grows with the size of its input, and turn a constraint on the input size into a decision before any code is written.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        big o,
        big theta,
        big omega,
        asymptotic analysis,
        amortized analysis,
        cost model,
        constraint analysis,
        operation count,
    ]
prerequisites:
    required: [start.computational-foundations]
    recommended: [start.algorithm-analysis]
complexity:
    time: "a method, not an algorithm"
    space: "a method, not an algorithm"
assumptions:
    - A cost model is fixed before any bound is stated, so that "one unit of work" means the same thing in every claim.
    - Bounds describe growth rates, not the wall-clock time of one particular machine.
reviewed: false
---

## At a glance

Complexity analysis is the practice of describing how much work an algorithm does as its input grows, so that two algorithms can be compared and an approach can be rejected before it is written. The notation has three symbols and they carry three different meanings: $O$ states an upper bound, $\Omega$ states a lower bound, and $\Theta$ states the growth rate exactly. Underneath the notation sits a cost model, which is the agreement about what one unit of work is. Without it, a bound is not a claim about anything.

The same handful of ideas produce a bound for straight-line code, for nested loops whose inner bound depends on the outer variable, for recursive algorithms through a recurrence relation, for data structures through amortized analysis, and for whole families of algorithms through a space and time tradeoff. The last step is the one that decides contests: read the constraint on the input size, use it to eliminate approaches, and keep only the ones that can still finish.

This article agrees with the academy's [algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis) course and fills in what a reference page needs. The bounds are stated as definitions, the derivations are shown rather than asserted, and the constraint filter ends with a table of what fits and an explicit warning about what the table is not.

## Problem motivation

A contest problem states a limit on the input size. That limit is the most useful sentence in the statement, and it is the sentence that most solutions ignore.

Suppose the statement says $n \le 200\,000$ and asks for the number of inversions in a permutation. The double loop that compares every pair performs $\frac{n(n-1)}{2}$ comparisons, which is about $2 \times 10^{10}$ steps. A machine performs on the order of $10^8$ simple operations per second in C++, so that loop needs about three minutes of the time limit's budget spread over a program that was supposed to finish in two seconds. Nothing about the algorithm is wrong. It is simply too slow for the input it was given, and the constraint said so from the first line.

The same constraint also eliminates solutions. A merge-sort based inversion count performs $O(n \log n)$ work, which is about $3.6 \times 10^6$ comparisons for the same input, and finishes comfortably. Two algorithms, one constraint, and a decision that can be made on paper.

The general form of the situation is this: an algorithm is a function of the input size, and a constraint is a number. To compare them you need one more thing, a measure of work that does not depend on the machine you happen to be sitting at.

## Recognition patterns

Complexity analysis is worth doing, in this order of preference, when you are about to do any of the following.

- **You are choosing between two approaches.** Both are written, or both are describable, and you need to know which one scales.
- **A constraint is in front of you.** The constraint is a filter, and the filter is cheap to apply.
- **You are about to add a feature to a hot loop.** A change that looks harmless inside a loop can change the complexity of the whole program.
- **You are choosing a data structure.** The choice is usually between several structures with different bounds, not between one structure and nothing.

Two signals in a problem statement matter most. A _large_ $n$ with a simple question means the answer must be found without touching every pair, which is the signal for a sublinear or linear method. A _small_ $n$ with a combinatorial question means enumeration is alive, and the size of the enumeration decides whether it is a bitmask loop, a meet in the middle split, or a dynamic program.

The pattern to avoid is analyzing only the code you are currently looking at. The bound that matters is the bound of the whole program, including the data structure it uses. A binary search over a linked list is $O(n \log n)$ and not $O(\log n)$, because each of the $\log n$ steps walks a list.

## Naive approach

The baseline is to count nothing and trust the shape of the code.

The usual first instinct is to count the lines inside the innermost loop and multiply by the number of times the outer loops run. That is right only when the inner count does not depend on the outer index, and it is wrong in the most common case.

A second instinct is to read the recursion depth and call it the complexity. A function that recurses on `n - 1` has depth $n$, but if it recurses twice it makes exponentially many calls. Depth is not work.

A third instinct is to time the program on a small input and extrapolate. This measures the constant, the cache behavior, and the machine, and it tells you very little about the growth rate, because a small input does not separate $\Theta(n \log n)$ from $\Theta(n^2)$ in any reliable way.

None of these three is a fallacy in general. They are simply the wrong tool for the question "which of these two approaches survives the constraint".

## Key insight

The insight that makes the whole subject work is that a bound is a _statement about growth_, and that statements about growth compose in predictable ways.

Two rules cover most manipulations. First, when work is done in sequence, the total is bounded by the larger of the two costs, because the program does one part and then the other, not both at once. Second, when work is done in nested fashion, with the inner count fixed, the total is the product, because each of the outer iterations pays the inner cost once.

Those two rules, plus the observation that a bound ignores everything that does not grow, are enough to analyze nearly every piece of contest code. The one case that needs more care is a nested loop whose inner bound depends on the outer variable, because then the product rule does not apply and a sum is required instead.

Everything else in this article is either a precise statement of these rules, a warning about the cases where they do not apply, or a way of turning the result into a decision.

## Formal model

Let $n$ be the size of the input and let $f(n)$ be the number of primitive operations performed by an algorithm on inputs of size $n$.

::: math definition Definition
A **cost model** is a specification of the cost of each operation an algorithm may use. The standard model is the random access machine, in which every primitive operation, including indexing into an array, costs $O(1)$.
:::

::: math definition Definition
For functions $f$ and $g$ from the natural numbers to the reals:

- $f(n) = O(g(n))$ if there are constants $c > 0$ and $n_0$ such that $0 \le f(n) \le c\,g(n)$ for every $n \ge n_0$.
- $f(n) = \Omega(g(n))$ if there are constants $c > 0$ and $n_0$ such that $f(n) \ge c\,g(n)$ for every $n \ge n_0$.
- $f(n) = \Theta(g(n))$ if both hold, which says that $f$ and $g$ have the same growth rate.
:::

The asymmetry between the three symbols is the source of most misstatements. An upper bound is a guarantee that the program will not be slower than the claim. A lower bound is a guarantee that some input makes it that slow. A tight bound is a statement about the growth rate, and it is the only one of the three that lets a reader compare two algorithms.

::: math definition Definition
An operation sequence has **amortized cost** $O(g(n))$ if there is a constant $c > 0$ such that the total cost of any sequence of $k$ operations on a structure of size $n$ is at most $c\,k\,g(n) + c\,n_0$, where $n_0$ is the size of the structure when the sequence began.
:::

Amortized cost is a statement about the sum of a sequence of costs divided by the length of the sequence. It holds for every sequence, with no probability and no distribution, and it does not say that any individual operation is cheap.

## Algorithm derivation

### A single loop

A loop that runs $n$ times and does constant work per iteration performs $\Theta(n)$ primitive operations. The comparison, the array read, the addition, and the assignment each cost one unit, so the count has the shape $c_1 n + c_0$ with $c_1 > 0$, which is $\Theta(n)$.

### Two loops with independent bounds

```cpp
for (int i = 0; i < n; i++)
    for (int j = 0; j < m; j++)
        work();
```

The inner loop runs $m$ times for each of the $n$ outer iterations, and $m$ does not depend on $i$. The total is $nm$ body executions plus the loop overhead, which is $\Theta(nm)$.

### Two loops with dependent bounds

```cpp
for (int i = 0; i < n; i++)
    for (int j = 0; j <= i; j++)
        work();
```

Here the inner count depends on the outer index: at outer index $i$ the inner loop runs $i+1$ times. The total is therefore a sum, not a product.

$$
T(n) = \sum_{i=0}^{n-1}(i+1) = 1 + 2 + \dots + n = \frac{n(n+1)}{2} = \Theta(n^2).
$$

Multiplying the bounds would give $n^2$, which lands on the right order here, but by accident: the inner loop does not run $n$ times, it runs an average of $\frac{n+1}{2}$ times. The reasoning is wrong even when the answer is right, and it is wrong in a way that matters when the inner bound grows faster or slower than the outer index.

The rule that covers the general case is that the cost is $\sum_{i=0}^{n-1} b(i)$ where $b(i)$ is the inner iteration count, and that if $b$ is non-decreasing then the sum is $\Theta(n \cdot b(n-1))$, because the last iterations dominate the average.

### A halving loop, for comparison

```cpp
while (n > 1) {
    n = n / 2;
}
```

Each iteration replaces $n$ by $\lfloor n/2 \rfloor$, so after $k$ iterations the value is $\lfloor n/2^k \rfloor$, which reaches $1$ exactly when $2^k \le n < 2^{k+1}$. The loop therefore executes $\lfloor \log_2 n \rfloor$ iterations and costs $\Theta(\log n)$.

The comparison is the point of the exercise. For $n = 10^6$ the triangular nested loop performs $\frac{10^6 \cdot 10^6 + 10^6}{2} \approx 5 \times 10^{11}$ body executions and the halving loop performs $19$. Both are three lines of code. Only one of them finishes.

### Recursion

A recursive algorithm has no loops to count, so the count is a recurrence relation. The two that appear most often are

$$
T(n) = 2\,T(n/2) + \Theta(n)
$$

for merge sort, which solves to $\Theta(n \log n)$, and

$$
T(n) = T(n-1) + \Theta(n)
$$

for quicksort with a degenerate pivot at every level, which solves to $\Theta(n^2)$. The master theorem in [algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis) states the general result; the two applications above are enough to see the shape.

### Amortized cost

A dynamic array that doubles when it is full copies $1$ element at the first growth, $2$ at the second, $4$ at the third, and so on. Over $m$ appends the total copying cost is

$$
1 + 2 + 4 + \dots + \frac{m}{2} < m.
$$

So $m$ appends cost $O(m)$ in total and the amortized cost of an append is $O(1)$, while the worst-case cost of a single append is $\Theta(m)$. Both statements are true at once, and the amortized one is what lets a contest solution use `push_back` in a loop without fear.

### Space and time together

Several standard techniques buy time with memory. A prefix sum array spends $O(n)$ time and $O(n)$ space once and turns every later range query from $O(n)$ into $O(1)$. A dynamic program that reads only the previous layer rolls down to two rows. A sparse table answers range queries in $O(1)$ at the price of $O(n \log n)$ space, which is only worth it when the data is static and the queries are many. Meet in the middle spends $O(2^{n/2})$ space to turn a $2^n$ search into a $2^{n/2}$ search.

The decision always comes back to the memory limit. A problem with a 256 MB limit and a problem with a 64 MB limit are two different problems, and the algorithm must change.

## Step-by-step execution

Take the dependent nested loop and count it for $n = 4$.

1. $i = 0$: the inner loop runs once, at $j = 0$. One execution.
2. $i = 1$: the inner loop runs twice, at $j = 0$ and $j = 1$. Two executions.
3. $i = 2$: three executions.
4. $i = 3$: four executions.

The total is $1 + 2 + 3 + 4 = 10$, and the closed form gives $\frac{4 \cdot 5}{2} = 10$. The $\Theta(n^2)$ claim is confirmed at $n = 4$, where the constant is exactly $0.5 n^2$.

Now take the halving loop at $n = 8$. The counter goes $8 \to 4 \to 2 \to 1$, which is three iterations, and $\lfloor \log_2 8 \rfloor = 3$. At $n = 9$ it goes $9 \to 4 \to 2 \to 1$, also three iterations, because $\lfloor \log_2 9 \rfloor = 3$.

Both counts are exact. A bound that cannot be evaluated on a small case is usually a bound that was guessed rather than derived.

## Correctness proof

::: math theorem Theorem
The loop

```cpp
for (int i = 0; i < n; i++)
    for (int j = 0; j <= i; j++)
        work();
```

executes its body exactly $\frac{n(n+1)}{2}$ times, and therefore runs in $\Theta(n^2)$ time.
:::

::: math proof Proof
Fix an outer index $i$. The inner loop starts at $j = 0$ and increments $j$ by one on every iteration, and it stops when $j > i$. Its body therefore executes once for each of $j = 0, 1, \dots, i$, which is $i + 1$ times.

The outer loop takes each of the values $i = 0, 1, \dots, n-1$ exactly once, so the total number of body executions is the sum of the inner counts over those values:

$$
\sum_{i=0}^{n-1}(i+1) = \sum_{k=1}^{n} k = \frac{n(n+1)}{2}.
$$

The last equality is the standard formula for the sum of the first $n$ positive integers, which follows by pairing the first term with the last, the second with the second to last, and so on: each pair sums to $n+1$, and there are $\frac{n}{2}$ such pairs, with a middle term of $\frac{n+1}{2}$ when $n$ is odd.

Finally, for $n \ge 1$ we have $\frac{n^2}{2} \le \frac{n(n+1)}{2} \le n^2$, so the count is bounded above and below by positive constant multiples of $n^2$. By the definition of $\Theta$, the running time is $\Theta(n^2)$. $\square$
:::

::: math theorem Theorem
Every comparison-based sorting algorithm performs at least $\lceil \log_2 (n!) \rceil$ comparisons, and therefore at least $\Omega(n \log n)$.
:::

::: math proof Proof
Such an algorithm can be modeled as a binary decision tree whose internal nodes are comparisons and whose leaves are the possible outcomes. Sorting $n$ distinct elements has $n!$ possible outcomes, one per ordering of the input, and each ordering must be reachable by some path, so the tree has at least $n!$ leaves. A binary tree of height $h$ has at most $2^h$ leaves, so $h \ge \log_2(n!)$. By Stirling's formula, $\log_2(n!) = n \log_2 n - n \log_2 e + O(\log n)$, which is $\Omega(n \log n)$. $\square$
:::

## Complexity analysis

The classes in order of growth, with the source that usually produces them:

| Class         | Growth       | Typical source                         |
| ------------- | ------------ | -------------------------------------- |
| $O(1)$        | constant     | array access, arithmetic, bit tricks   |
| $O(\log n)$   | logarithmic  | halving a range, binary search         |
| $O(n)$        | linear       | a single scan                          |
| $O(n \log n)$ | linearithmic | comparison sorting, divide and conquer |
| $O(n^2)$      | quadratic    | nested loops, naive sorting            |
| $O(n^3)$      | cubic        | dense matrix products                  |
| $O(2^n)$      | exponential  | subset enumeration                     |
| $O(n!)$       | factorial    | permutation enumeration                |

A bound is only meaningful together with the cost model it assumes. The random access model treats array indexing as $O(1)$, which is true for contiguous arrays in compiled languages and is not the whole truth for a Python list, where an index costs a bounds check and a pointer chase, nor for a hash table, where a lookup is constant only in expectation. Whenever a bound is stated, the model belongs in the sentence.

## Algorithm selection

| Situation                          | What the analysis suggests            |
| ---------------------------------- | ------------------------------------- |
| $n \le 20$, combinatorial question | Enumerate $2^n$ states with a bitmask |
| $n \le 40$, sum-like question      | Meet in the middle, $O(2^{n/2})$      |
| $n \le 2\,000$, pairwise question  | $O(n^2)$ with a small constant        |
| $n \le 10^5$, ordering question    | $O(n \log n)$                         |
| $n \le 10^7$, counting question    | $O(n)$                                |
| $n \le 10^9$, lookup question      | $O(\log n)$ or $O(1)$                 |

### Mapping a constraint to a plausible algorithm

A constraint is a filter, and it is cheapest to apply before designing anything. Suppose the budget is $10^7$ primitive operations.

| Complexity    | Work at size $n$ | Largest $n$ that fits the budget |
| ------------- | ---------------- | -------------------------------- |
| $O(1)$        | $1$              | any                              |
| $O(\log n)$   | $\log_2 n$       | $n < 2^{10^7}$                   |
| $O(n)$        | $n$              | $10^7$                           |
| $O(n \log n)$ | $n \log_2 n$     | about $5 \times 10^5$            |
| $O(n^2)$      | $n^2$            | about $3 \times 10^3$            |
| $O(n^3)$      | $n^3$            | about $2 \times 10^2$            |
| $O(2^n)$      | $2^n$            | $23$                             |
| $O(2^{n/2})$  | $2^{n/2}$        | $46$                             |

**These are operation counts, not runtime predictions.** A budget of $10^7$ primitive operations is a budget, not a stopwatch. The same count means very different amounts of time depending on the language, the constant factor hidden inside each operation, the memory layout, and whether the program is cache friendly. A C++ loop performing $10^7$ simple additions runs in a small fraction of a second, the same loop in Python runs in about a second, and the same loop in Java depends on whether the just-in-time compiler had time to optimize it. A bound of $O(n^2)$ at $n = 3\,000$ might be fine or might be too slow, and the table cannot tell you which.

The table is therefore a filter and not a promise. It answers one question only: which approaches are still alive after the constraint has been applied. The judgment that remains is a constant-factor judgment, and it belongs to the machine, not to the algorithm.

## Recursion decision

A complexity claim about a recursive algorithm is a claim about a recurrence relation, and the recurrence must be solved rather than guessed. Two habits keep the analysis honest.

First, count calls, not depth. A function that recurses twice on `n - 1` has depth $n$ and $\Theta(2^n)$ calls, and the two differ by a factor that grows without bound.

Second, decide the depth before choosing the recursive form. The depth of a recursion is a function of the input, not of the algorithm's cleverness, and each language has its own limit. The details are in [recursion](/algorithms/foundations/recursion); the summary is that a depth that can reach $10^5$ or more should be held on an explicit stack in the heap rather than on the call stack.

## Implementation walkthrough

Complexity claims are lost in code when the loop bound is written twice or when the bound depends on a value the analysis did not consider.

```cpp
for (int i = 0; i < n; i++) {
    for (int j = 0; j <= i; j++) {   // the inner bound depends on i
        work();
    }
}
```

The two mistakes that change the class of the analysis are writing the inner bound in terms of the outer variable when it does not depend on it (which adds an unnecessary factor of $n$), and hiding a logarithm inside a helper function whose cost is not counted.

```cpp
for (int i = 0; i < n; i++)
    for (int j = 1; j < n; j *= 2)   // logarithmic inner bound
        work();
```

Here the cost is $\Theta(n \log n)$, not $\Theta(n^2)$, and the difference between the two answers is the difference between passing and failing.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Multiplying two dependent loop bounds | Right order by luck, wrong reasoning, wrong verdict when the inner bound is logarithmic | Sum the inner counts instead |
| Reading a recursive function's depth as its cost | Exponential algorithms look linear | Count calls, solve the recurrence |
| Stating $O(n^2)$ for a $\Theta(n)$ algorithm | Formally true, strictly less informative | Use $\Theta$ when the growth rate is known |
| Ignoring the cost of a helper | The bound is off by a factor of the helper's cost | Count every call, including library calls |
| Assuming a library operation is $O(1)$ | Hash lookups, `sort` inside a loop, string concatenation | Look up the actual bound and the actual model |
| Comparing bounds across different models | The comparison is meaningless | State the model with the bound |
| Reading the constraint after designing | Time wasted on an algorithm that cannot pass | Read the constraint first, always |
| Treating an average-case bound as a guarantee | A sorted input defeats it | Prove the worst case, or randomize |

### Why this fails: counting recursion depth instead of calls

The plausible wrong approach is this: a function recurses on `n - 1`, so it goes $n$ levels deep, therefore it is $O(n)$. The depth claim is correct. The cost claim is not.

```cpp
long long fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
```

The smallest counterexample is $n = 5$. The recursion depth is $5$, but the function makes $15$ calls: the count of calls to `fib(n)` in this version is $2F(n+1) - 1$, and $F(6) = 8$ gives $2 \cdot 8 - 1 = 15$. At $n = 20$ the depth is still $20$ while the call count is $2 \cdot 10946 - 1 = 21\,891$. The two quantities are not related by any constant factor, and the class is $\Theta(\varphi^n)$ with $\varphi \approx 1.618$, not $\Theta(n)$.

The mistake is general. Depth is a bound on how much memory the recursion needs; the number of calls is a bound on how much work it does. They agree only when the recursion tree has one node per level, which happens only when each call makes at most one recursive call.

The lesson generalizes: **count the work, not the shape of the code.** The number of times a line executes is the only quantity that a bound is a bound of, and the shape of the code is merely a hint about where to start counting.

## Variants and extensions

- **Expected versus worst case.** "The average case is $O(n \log n)$" is meaningless without a distribution. The standard claim for quicksort is about a uniformly random permutation, and it says nothing about the sorted input a judge may well provide.
- **Space bounds.** Two dimensions matter and they are usually different: auxiliary space, which excludes the input, and total space, which includes it.
- **Bit complexity.** When the values are integers, the cost of an operation depends on their width. Multiplying two $b$-bit numbers is not $O(1)$ in a model that counts bit operations; it is $O(b^2)$ by schoolbook multiplication.
- **Output sensitive bounds.** Some algorithms are linear in the size of the answer rather than the size of the input, which is the best a generator can do.

## Contest strategy

A fixed procedure that survives time pressure.

1. Read the constraint on the input size before reading the rest of the statement carefully, and write down the target complexity class.
2. Name the cost model in one phrase: "random access, $n$ elements".
3. For each nested loop, decide whether the inner bound depends on the outer index before touching the formula. If it does, sum.
4. For a recursive function, write the recurrence and solve it. Do not report the depth.
5. Check the memory of every table before allocating it. Multiply the dimensions, then multiply by the element size.
6. When two algorithms are both viable, prefer the one with the better complexity class over the one with the smaller constant, unless the crossover point is inside the range of possible inputs.

## Worked problems

### Problem 1: counting inversions

**Restatement.** Given a permutation of $n$ numbers, count the pairs $(i,j)$ with $i < j$ and $a_i > a_j$. Constraints: $n \le 2 \times 10^5$.

**Naive baseline.** The double loop performs $\frac{n(n-1)}{2} \approx 2 \times 10^{10}$ comparisons, which is minutes of work and far past the time limit.

**Insight.** A merge already knows how many elements of the right half exceed the element it is about to place, so the count falls out of the merge.

**Derivation.** Modify merge sort so that each merge returns the number of crossing inversions it resolved, and add the counts of the two halves.

**Correctness.** Every inversion is either inside the left half, inside the right half, or crosses between them, and the three cases are disjoint. The recursive calls count the first two and the merge counts the third.

**Complexity.** $O(n \log n)$ time and $O(n)$ auxiliary space, against $O(n^2)$ for the baseline.

**Common wrong approach.** Recomputing the inversion count inside the merge by scanning, which restores the quadratic cost.

### Problem 2: summing without storing the input

**Restatement.** Given $n$ integers, one per line, print their sum. Constraints: $n \le 10^7$.

**Naive baseline.** Read all $n$ into an array, then sum. Costs $O(n)$ time and $4n$ bytes, so $40$ MB for $10^7$ 32-bit integers, plus the cost of reading them all into memory at once.

**Insight.** The sum can be accumulated as the values arrive, so the storage is $O(1)$.

**Derivation.** Keep one accumulator and add each value to it as it is read.

**Correctness.** The accumulator holds the sum of every value read so far, by induction on the number of values read.

**Complexity.** $O(n)$ time, $O(1)$ auxiliary space, against $O(n)$ space for the baseline.

**Common wrong approach.** Storing the values to sort them later, when the statement only asks for a sum. The sort was never needed.

### Problem 3: choosing a method for the pair count

**Restatement.** Given $n$ integers, count the pairs with $i < j$ and $a_i + a_j = K$. Constraints: $n \le 10^5$.

**Naive baseline.** $O(n^2)$ pairs, about $5 \times 10^9$, too slow.

**Insight.** Sorting puts the two halves of every valid pair on opposite sides of the array, and two pointers from the ends find them in one pass.

**Derivation.** Sort, then place one pointer at each end. Move the left pointer right when the sum is too small and the right pointer left when the sum is too large.

**Correctness.** The two-pointer argument is the same monotone predicate argument that [binary search](/algorithms/searching/binary-search) rests on: each move discards a half that cannot contain a valid pair.

**Complexity.** $O(n \log n)$ time, dominated by the sort.

**Common wrong approach.** Using a hash table, which is $O(n)$ expected but $O(n^2)$ in the worst case when every value collides, and pays a large constant for the table itself.

## Practice progression

1. **Recognition.** Given a program and a constraint, say whether it can pass. This is the skill the whole article exists for.
2. **Direct application.** Analyze a set of loops, including one with a dependent inner bound and one with a halving inner bound.
3. **Adaptation.** Derive the recurrence for a new recursive function and solve it with the master theorem.
4. **Combination.** Compute the memory of a two-dimensional table and decide whether it fits; then decide whether to roll it or to change the algorithm.
5. **Challenge.** Prove that a proposed $O(n^2)$ algorithm has a sub-quadratic special case, and find the condition that triggers it.
6. **Transfer.** Turn a constraint into a plan for a problem you have never seen, and defend the plan with a bound before writing the code.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does each of $O$, $\Omega$ and $\Theta$ guarantee, and why is an upper bound not a statement about tightness? (Formal model)
2. What does the random access machine assume, and which two common operations violate it? (Formal model)
3. Derive the cost of the dependent nested loop, and say why multiplying the two bounds would have been wrong reasoning. (Algorithm derivation)
4. How many iterations does the halving loop perform, and why does the comparison matter? (Algorithm derivation)
5. State the decision-tree argument for the $\Omega(n \log n)$ lower bound on comparison sorting. (Correctness proof)
6. What is the largest input size for which $O(n \log n)$ fits a budget of $10^7$ operations, and why is that not a runtime prediction? (Algorithm selection)
7. Give a program whose recursion depth is $n$ but whose call count is exponential, and say which one a bound must use. (Common mistakes)
8. How does amortized cost differ from expected cost, and which data structure illustrates each? (Formal model)
9. Name four ways to spend memory to save time, and say when each is worth it. (Algorithm derivation)
10. What must you decide before implementing a nested loop, and what must you compute before allocating a table? (Contest strategy)

## Further reading

- The full treatment of every module in this article, with worked checkpoints, is in [algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis).
- The machine model that the cost model assumes, including the activation record and the call stack, is in [computational foundations](/start/from-ap-csa/part-1-computational-foundations).
- The recursion that the recurrence relations describe, and the depth limits that make some of them unsafe, is in [recursion](/algorithms/foundations/recursion).
- The bit tricks that make $O(1)$ operations possible are in [binary representation](/algorithms/foundations/binary-representation).
- The enumeration that sits at the top of the complexity ladder, and the meet in the middle split that moves it down, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
