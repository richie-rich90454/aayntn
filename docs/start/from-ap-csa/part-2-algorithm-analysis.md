---
id: start.algorithm-analysis
title: Algorithm analysis
summary: Counting operations, bounding them with Big O, and turning a constraint into a plausible algorithm before you write any code.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [big o, complexity, amortized, recurrence, master theorem, constraints]
prerequisites:
    required: [start.computational-foundations]
    recommended: [start.from-ap-csa, foundations.complexity]
reviewed: false
draft: false
---

Part 2 is the ruler. It gives you a way to say how much work an algorithm does as its input grows, and therefore a way to reject an algorithm before you spend twenty minutes implementing it.

The ten modules below build that ruler in order. Modules 2.1 to 2.3 define the measure and the notation. Module 2.4 analyzes loops, which is where most contest complexity claims are actually made. Modules 2.5 and 2.6 handle recursion and average-case reasoning. Modules 2.7 and 2.8 address the parts of performance that Big O deliberately hides. The last two modules turn all of it into a decision procedure: given a constraint, which algorithms are still alive?

<Synonyms terms="complexity analysis, big-o analysis, asymptotic analysis, time complexity, performance analysis" />

## 2.1 Primitive operations and cost models

A **primitive operation** is a basic computation whose cost is bounded by a constant independent of the size of the input: adding two integers, comparing two values, assigning a variable, or reading one element of an array. The cost model of algorithm analysis counts primitive operations rather than seconds, because seconds depend on the machine and the compiler and the mood of the machine, while operation counts do not.

The model that justifies this is the random-access machine, in which every primitive operation, including array indexing, costs $O(1)$. This is a deliberate idealisation, and it is right far more often than beginners expect, because in compiled languages an array element really is one memory reference away from the last one.

Two caveats matter. The model is wrong for Python lists, where `append` is amortised rather than constant and `list[i]` costs an index check plus a pointer dereference. And it is wrong for hash tables, where a lookup is constant only in expectation, not in the worst case. Whenever you state a complexity bound, say which implementation and which model it assumes.

**Why it matters.** The point of counting is to compare two algorithms on the same footing. Counting seconds compares a C++ program on your laptop with a Python program on the judge, which tells you about the machines rather than about the algorithms.

**Worked example.** Consider summing an array:

```cpp
long long sum = 0;
for (int i = 0; i < n; ++i) {
    sum += a[i];
}
```

Each iteration performs one comparison, one array read, one addition, and one assignment, so the total is about $4n + 2$ primitive operations: four per element plus a constant. Under the random-access model this is $\Theta(n)$.

**What you must get right.** The unit-cost assumption applies to the operations your model covers. When you write "$O(1)$ per operation" for something that involves hashing, or for a Python list append, you are claiming something stronger than the model supports.

### Checkpoint

**Conceptual.**

1. Define a primitive operation, and state the assumption the random-access machine makes about the cost of indexing an array.
2. Explain why the analysis counts operations instead of seconds, and give one case where counting seconds would mislead you.
3. Name two operations that are constant time in C++ but not in Python. Say why the difference does not change the asymptotic class of a loop that uses them.

**Code reading.**

1. Count the primitive operations of this loop and give its tight complexity, stating the model you are using:

    ```cpp
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            total += a[i] * a[j];
    ```

2. This loop is written in Python. Give its tight complexity, then say whether the Python implementation changes the answer:

    ```python
    total = 0
    for i in range(n):
        for j in range(n):
            total += a[i] * a[j]
    ```

**Implementation.** Write a function that returns both the value and the number of primitive operations performed when finding the maximum of an array of $n$ integers. Verify your count on arrays of length 0, 1, 2 and 10, and state the formula your count follows.

**Applied problem.** A problem gives $n \le 10^7$ integers and asks for their sum. Estimate the memory required to store the array, state whether it fits in a 64 MB limit, and describe an alternative that reduces the memory to $O(1)$.

## 2.2 Big O, Big Theta and Big Omega

Asymptotic notation compares growth rates while ignoring everything that does not grow.

::: math definition Asymptotic bounds
Let $f$ and $g$ be functions from the natural numbers to the reals.

- $f(n) = \O(g(n))$ if and only if there exist constants $c > 0$ and $n_0$ such that $0 \le f(n) \le c\,g(n)$ for all $n \ge n_0$. That is, $g$ is eventually an upper bound on $f$.
- $f(n) = \Omega(g(n))$ if and only if there exist constants $c > 0$ and $n_0$ such that $f(n) \ge c\,g(n)$ for all $n \ge n_0$. That is, $g$ is eventually a lower bound on $f$.
- $f(n) = \Theta(g(n))$ if and only if both hold. That is, $f$ and $g$ have the same growth rate.
:::

Two consequences are worth memorising because they are the source of most misstatements.

First, an upper bound is not a statement about tightness. If an algorithm runs in $\Theta(n)$ time, it is also $\O(n^2)$, $\O(n^{10})$, and $\O(2^{2^n})$. All of those are true and all of them are useless for choosing between algorithms.

Second, $\O$ is not a synonym for "roughly". When a contest solution claims "$O(n \log n)$", the reader wants a guarantee that the program will not take $n^2$ steps for some large input, and a claim of $\O(n^2)$ for an algorithm that actually runs in $\Theta(n)$ will be judged incorrect even though it is formally true.

::: math counterexample A formally true but useless bound
An algorithm that runs in $\Theta(n)$ time also runs in $\O(n^2)$ time, because $n \le c\,n^2$ for $c = 1$ and every $n \ge 1$. Writing "this is $O(n^2)$" about an $O(n)$ algorithm is a true statement that gives the reader strictly less information than the truth, and it is the reason contest solutions are expected to state $\Theta$ when they mean the growth rate.
:::

Two derived rules cover most manipulations. If $f(n) = \O(g(n))$ and $g(n) = \O(h(n))$, then $f(n) = \O(h(n))$: bounds compose. And $f(n) + g(n) = \O(\max\{f(n), g(n)\})$: a sum of two costs is bounded by the larger one.

**Why it matters.** Complexity is the first thing you check when you read a constraint. If $n$ can be $10^5$ and the algorithm is $\Theta(n^2)$, the solution is dead before you write it, and no amount of clever constant-factor tuning will save it.

**Worked example.** To show that $3n^2 + 5n + 100 = \O(n^2)$, choose $c = 108$ and $n_0 = 1$: for $n \ge 1$, $5n + 100 \le 5n^2 + 100n^2 = 105n^2$, so the whole expression is at most $108n^2$. To show it is also $\Omega(n^2)$, take $c = 3$ and $n_0 = 1$.

**What you must get right.** Use $\O$ when you are guaranteeing an upper bound and $\Theta$ when you are claiming the growth rate. The two are not interchangeable in a solution write-up, and a grader reads $\O(n^2)$ on a linear algorithm as a sign that the analysis was not done.

### Checkpoint

**Conceptual.**

1. State the definitions of $\O$, $\Omega$ and $\Theta$ including the quantifiers over $c$ and $n_0$.
2. Explain why "this algorithm is $O(n^2)$" can be a true statement about an $O(n)$ algorithm and still be a serious error in a write-up.
3. State the two composition rules: how bounds compose under chaining, and how a sum of two costs is bounded.

**Code reading.**

1. This claim appears in a solution: "the algorithm runs in $O(n \log n)$". State exactly what that guarantees and what it does not guarantee about the program.

    ```text
    For each of the n elements we insert into a balanced search tree.
    ```

2. This function is claimed to be $O(n)$. Find the mistake:

    ```cpp
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[i] == a[j]) return true;
    ```

**Implementation.** For each of the four functions below, state a tight bound and justify it in one sentence: (a) a loop from 0 to $n$ that adds a constant; (b) a loop from 0 to $n$ that multiplies a variable by 2; (c) a loop that scans an array for a value; (d) a loop that scans a sorted array with binary search.

**Applied problem.** A solution claims $O(n \log n)$ for a routine that sorts the input and then does a linear scan of the sorted array. Is the claim correct? What is the tight bound, and what would you have to check to know that the claim is safe rather than merely true?

## 2.3 Constant, logarithmic, linear and polynomial complexity

With the notation in place, it is worth having the standard ladder memorised, because you will use it constantly in module 2.9.

| Class          | Growth       | Typical source                                       |
| -------------- | ------------ | ---------------------------------------------------- |
| $\O(1)$        | constant     | array access, hash lookup in expectation, arithmetic |
| $\O(\log n)$   | logarithmic  | halving a range, binary search                       |
| $\O(n)$        | linear       | a single scan                                        |
| $\O(n \log n)$ | linearithmic | comparison-based sorting                             |
| $\O(n^2)$      | quadratic    | nested loops, naive sorting                          |
| $\O(n^3)$      | cubic        | triple nested loops, dense matrix products           |
| $\O(2^n)$      | exponential  | subset enumeration                                   |
| $\O(n!)$       | factorial    | permutation enumeration                              |

The interesting boundary in contests is usually between $n^2$ and $n \log n$, and occasionally between $n$ and $\log n$. Knowing that a comparison sort must cost $\Omega(n \log n)$ means that once you need sorted order, there is no asymptotically cheaper option, only different constants.

::: math theorem Lower bound for comparison sorting
Any algorithm that sorts $n$ distinct elements by comparing pairs performs at least $\lceil \log_2 (n!) \rceil$ comparisons, which is $\Omega(n \log n)$.

_Proof._ A sorting algorithm that only compares elements can be modeled as a binary decision tree whose leaves are the $n!$ possible orderings. The tree must have at least $n!$ leaves, because each leaf must correspond to a distinct permutation of the input. A binary tree of height $h$ has at most $2^h$ leaves, so $h \ge \log_2 (n!)$. By Stirling's formula $\log_2 (n!) = n \log_2 n - n \log_2 e + O(\log n)$, which is $\Omega(n \log n)$. _End of proof._
:::

Now the halving loop, which is the cheapest logarithm you will ever derive:

```cpp
while (n > 1) {
    n = n / 2;      // integer division
}
```

Each iteration replaces $n$ by $\lfloor n/2 \rfloor$. After $k$ iterations the value is $\lfloor n / 2^k \rfloor$, which equals $1$ exactly when $2^k \le n < 2^{k+1}$. The loop therefore executes

$$
T(n) = \left\lfloor \log_2 n \right\rfloor
$$

iterations, and $T(n) = \Theta(\log n)$. The same number of steps answers the question "how many times can I halve $n$ before reaching $1$?", which is exactly the intuition behind binary search.

**Why it matters.** Recognizing a halving loop as logarithmic is the difference between believing a problem is easy and believing it is impossible. Both directions of the mistake happen.

**Worked example.** Binary search over an array of $n$ elements halves the search interval each step, so it performs $\lceil \log_2 n \rceil$ iterations in the worst case. A linear search performs up to $n$. For $n = 10^6$ that is 20 comparisons against a million.

**What you must get right.** The logarithm counts halvings of the _input_, not of the answer. And $\log_2 n$ versus $\log_{10} n$ differs only by a constant factor, so the base never matters for complexity, though it does matter when you convert a bit count into a number of steps.

### Checkpoint

**Conceptual.**

1. Derive the exact iteration count of the halving loop, and say why it is $\lfloor \log_2 n \rfloor$ rather than $\lceil \log_2 n \rceil$.
2. Summarize the decision-tree argument that gives the $\Omega(n \log n)$ lower bound for comparison sorting, and say which kind of sorting escapes it.
3. Order these six classes from slowest growth to fastest: $\O(\log n)$, $\O(n)$, $\O(n \log n)$, $\O(n^2)$, $\O(n^3)$, $\O(2^n)$.

**Code reading.**

1. This loop halves a counter that starts at 1 and stops when it reaches $n$. How many iterations does it perform for $n = 10^9$, and what is the tight complexity?

    ```cpp
    long long c = 1;
    while (c < n) c *= 2;
    ```

2. This loop decrements a counter to zero. Give its tight complexity and say why it differs from the halving loop by so much.

**Implementation.** Implement binary search over a sorted vector and count the number of comparisons it performs. Check that the count is at most $\lceil \log_2 n \rceil + 1$ for every $n$ from 1 to 1000, and report the worst case you find.

**Applied problem.** A problem has $n \le 10^9$ sorted values and asks whether a target is present. Explain why a linear scan cannot work, give the complexity of binary search, and estimate the number of comparisons in the worst case.

## 2.4 Nested-loop analysis and dependent loop bounds

This is the module where most contest complexity claims are actually made, and where most mistakes live.

**Independent bounds multiply.** If the inner loop's count does not depend on the outer variable, the total is the product:

```cpp
for (int i = 0; i < n; i++)      // n iterations
    for (int j = 0; j < m; j++)  // m iterations, independent of i
        body();
```

Here $T(n, m) = nm \cdot c + \O(n + m) = \Theta(nm)$.

**Dependent bounds add.** If the inner bound depends on the outer variable, the total is a sum over the outer iterations, and the shape of the inner bound determines the result:

```cpp
for (int i = 0; i < n; i++)
    for (int j = 0; j <= i; j++)
        body();
```

The outer loop runs $n$ times. In iteration $i$ the inner loop runs $i+1$ times, so the total number of body executions is

$$
T(n) = \sum_{i=0}^{n-1}(i+1) = \frac{n(n+1)}{2} = \Theta(n^2).
$$

The summation is the closed form of an arithmetic series, and it is the single most useful formula in this module: $\sum_{i=1}^{n} i = n(n+1)/2$. Multiplying the two bounds instead, as beginners instinctively do, would give $n^2$ and lands on the right answer here only by accident. It is wrong in general: the inner loop does not run $n$ times, it runs an average of $(n+1)/2$ times.

::: math complexity Dependent bounds
For a loop whose inner bound is a function of the outer index, the cost is $\sum_{i=0}^{n-1} b(i)$ where $b(i)$ is the inner iteration count. If $b(i)$ is non-decreasing in $i$, this sum is $\Theta(n \cdot b(n-1))$, because the last iteration dominates the average.
:::

Compare the two loops directly. The halving loop of module 2.3 does $\lfloor \log_2 n \rfloor$ steps; the dependent nested loop does $n(n+1)/2$ steps. For $n = 10^6$ that is 20 steps against roughly $5 \times 10^{11}$. Both loops are short to write. Only one of them finishes.

Three variations are worth recognizing on sight:

```cpp
// Logarithmic inner bound: the cost is n log n, the sorting signature.
for (int i = 0; i < n; i++)
    for (int j = 1; j < m; j *= 2)
        body();

// Triangular inner bound: the cost is n^2 / 2, not n^2.
for (int i = 0; i < n; i++)
    for (int j = 0; j < n - i; j++)
        body();

// Early exit: the cost is now O(n) amortised, not O(n^2).
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        if (a[i] + a[j] == target) return true;
```

**Why it matters.** A constraint of $n \le 1000$ admits an $n^2$ loop comfortably; a constraint of $n \le 10^5$ does not. The difference between the two is exactly this module.

**Worked example.** A problem asks for the number of pairs $(i, j)$ with $i < j$ and $a_i + a_j = K$. The naive solution is a double loop over all pairs, which costs $\Theta(n^2)$ with the dependent bound $1 + 2 + \dots + (n-1) = n(n-1)/2$. With $n \le 10^5$ that is $5 \times 10^9$ pairs, so the naive version cannot be the intended solution. Sorting and using two pointers costs $\Theta(n \log n)$.

**What you must get right.** Decide, before you count, whether the inner bound depends on the outer index. If it does, you must sum, not multiply. And when the inner bound is increasing, the sum is dominated by the last iterations, so you can usually replace it with $n$ times the largest inner count.

### Checkpoint

**Conceptual.**

1. State the rule for when two nested loop bounds multiply and when they add, and explain what feature of the inner bound decides which case applies.
2. Derive $\sum_{i=0}^{n-1}(i+1)$ and show why multiplying the bounds instead of summing them is wrong reasoning even when it happens to give the right answer.
3. Explain why the cost of a nested loop with a logarithmic inner bound is $\Theta(n \log n)$ rather than $\Theta(n^2)$.

**Code reading.**

1. Give the tight complexity of this loop, and say whether the bounds multiply or add:

    ```cpp
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            work();
    ```

2. Give the tight complexity of this loop, and state the exact number of body executions for $n = 5$:

    ```cpp
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i; j++)
            work();
    ```

**Implementation.** Write a function that, given $n$, computes the exact number of body executions of the loop `for i in 0..n-1: for j in 0..i`. Check it against a direct simulation for $n$ from 0 to 20, and state the closed form and the tight complexity.

**Applied problem.** A problem asks, for an array of $n$ integers, how many pairs $(i, j)$ satisfy $i < j$ and $a_i + a_j = K$. Give the complexity of the double loop, say at what value of $n$ it stops being viable under a two-second limit in C++, and describe a faster approach and its complexity.

## 2.5 Recurrences and recursion trees

A recursive algorithm does not have loops to count. It has a recurrence relation: an equation that defines the cost of the problem on $n$ in terms of the cost on smaller inputs.

::: math recurrence Master theorem
Let $T(n) = a\,T(n/b) + f(n)$ with $a \ge 1$, $b > 1$, and $f(n) = \Omega(n^{\log_b a - \epsilon})$ for some $\epsilon > 0$. Then

$$
T(n) = \Theta\!\left(n^{\log_b a}\right).
$$

The quantity $\log_b a$ is called the exponent of the recurrence, and it alone determines the answer when $f(n)$ is small enough.
:::

The three cases of the master theorem are:

1. If $f(n) = \O(n^{\log_b a - \epsilon})$, then $T(n) = \Theta(n^{\log_b a})$. The recursive work dominates.
2. If $f(n) = \Theta(n^{\log_b a})$, then $T(n) = \Theta(n^{\log_b a} \log n)$. The two are balanced, and every level of the recursion tree does the same amount of work.
3. If $f(n) = \Omega(n^{\log_b a + \epsilon})$, then $T(n) = \Theta(f(n))$. The non-recursive work dominates.

The intuition is the recursion tree. Make a node for the problem of size $n$, give it $a$ children of size $n/b$, and stop when the size falls below $1$. There are $\log_b n$ levels. Each level does $f(n)$ work in total, so the whole tree does $f(n) \log_b n$ unless the tree is unbalanced, and the level widths form a geometric series that sums to $n^{\log_b a}$.

**Worked examples.**

Binary search satisfies $T(n) = T(n/2) + \Theta(1)$. Here $a = 1$, $b = 2$, so $\log_b a = 0$, and $f(n) = \Theta(1) = \Theta(n^0)$, which is case 2 with $\epsilon$ chosen small. The result is $T(n) = \Theta(n^0 \log n) = \Theta(\log n)$.

Merge sort satisfies $T(n) = 2T(n/2) + \Theta(n)$. Here $a = 2$, $b = 2$, so $\log_b a = 1$, and $f(n) = \Theta(n) = \Theta(n^1)$: case 2 again. The result is $T(n) = \Theta(n \log n)$.

Naive recursive Fibonacci satisfies $T(n) = T(n-1) + T(n-2) + \Theta(1)$, which is not of the master theorem's shape. Its growth is $\Theta(\varphi^n)$ where $\varphi = (1 + \sqrt{5})/2 \approx 1.618$, so the number of calls grows exponentially. This is why naive Fibonacci cannot compute $F(80)$ in any reasonable time, and why the memoised version, whose recurrence is $T(n) = T(n-1) + \Theta(1)$, takes $\Theta(n)$ time and $\Theta(n)$ space instead.

**Why it matters.** Many of the algorithms you will meet are naturally recursive, and their complexity is not visible from the source code without solving the recurrence.

**Worked example.** Quicksort's recurrence is $T(n) = T(k) + T(n - k - 1) + \Theta(n)$, where $k$ is the pivot's rank. The worst case is $k = 0$ every time, giving $T(n) = T(n-1) + \Theta(n) = \Theta(n^2)$; the average case is $\Theta(n \log n)$. The difference is entirely in the pivot choice, which is why randomised pivoting is standard.

**What you must get right.** Solve the recurrence, do not guess the answer and then justify it. And state the assumption that goes into the answer: a complexity claim about a recursive algorithm is a claim about a particular input, unless you have shown it holds for all inputs.

### Checkpoint

**Conceptual.**

1. State the master theorem and identify its three cases by comparing $f(n)$ with $n^{\log_b a}$.
2. Apply it to $T(n) = T(n/2) + \Theta(1)$ and to $T(n) = 2T(n/2) + \Theta(n)$, saying which case applies in each.
3. Explain why naive recursive Fibonacci is exponential while memoised Fibonacci is linear, in terms of the number of times each subproblem is computed.

**Code reading.**

1. Give the recurrence for this recursion and solve it, stating the input it assumes the worst case over:

    ```python
    def f(n):
        if n <= 1:
            return 1
        return f(n - 1) + f(n - 2)
    ```

2. Give the recurrence for this recursion, solve it, and say what input makes it slowest:

    ```cpp
    void h(int n) {
        if (n <= 0) return;
        h(n - 1);
    }
    ```

**Implementation.** Implement naive recursive Fibonacci and memoised Fibonacci for the same input, count the number of function calls each performs, and report the counts for $n = 20$, $30$ and $40$. State the complexity of each and explain the difference.

**Applied problem.** A divide-and-conquer routine splits a list of size $n$ into two halves, recurses on each, and then merges the results in linear time. Write its recurrence, apply the master theorem, and state the resulting complexity. Then say what changes if the merge takes quadratic time instead.

## 2.6 Worst-case, average-case and amortized analysis

Three different questions get confused under the name "complexity".

**Worst case** is the maximum cost over all inputs of size $n$. It is the right default for contest problems, because the judge decides the time limit using the largest input it will use, and a guarantee must hold for every input.

**Average case** is the expected cost over a probability distribution on inputs. It is meaningless without the distribution. "The average case of quicksort is $O(n \log n)$" means: if every permutation is equally likely, the expected cost is $\Theta(n \log n)$. If the input is sorted, the expected cost under a different distribution is $\Theta(n^2)$.

**Amortised cost** bounds the average cost of an operation in a _sequence_, without any randomness. It is a statement about the sum of costs over a sequence of $k$ operations divided by $k$, and it holds for every sequence. It does not say that any individual operation is cheap.

::: math definition Amortised constant time
An operation sequence has amortised cost $\O(g(n))$ if there is a constant $c > 0$ such that the total cost of any sequence of $k$ operations is at most $c\,k\,g(n) + c\,n_0$, where $n_0$ is the size of the data structure at the start. The additive term accounts for the initial build.
:::

**Worked example.** A dynamic array that doubles when it is full. The first append copies 1 element, the second growth copies 2, the next 4, and so on. Over a sequence of $m$ appends starting from an empty array, the total copying cost is

$$
1 + 2 + 4 + \dots + \frac{m}{2} < m.
$$

So $m$ appends cost $O(m)$ in total, and the amortised cost of an append is $O(1)$. The _worst-case_ cost of a single append is $\Theta(m)$, because the doubling append copies the whole array. Both statements are true simultaneously, and that is the point: the amortised bound is what lets you write `vector.push_back(x)` in a loop without fear, and it is the reason the bound is guaranteed for every sequence rather than merely on average.

The same distinction explains hash tables: a lookup is $\O(1)$ in expectation under a good hash function and a uniform input distribution, and $\Theta(n)$ in the worst case, when every key lands in the same bucket. The expected bound is the one that describes typical behavior; the worst-case bound is the one a judge can construct for you.

**Why it matters.** Contest problems are judged on the worst case, so worst-case bounds are what you must prove. Amortised bounds are how you justify a data structure whose individual operations are occasionally expensive.

**Worked example.** Disjoint set union with union by rank and path compression has amortised cost $\O(\alpha(n))$ per operation, where $\alpha$ is the inverse Ackermann function, which is smaller than $\log n$ for every $n$ that has ever been written down. This is the reason DSU is the right structure for connectivity problems with $10^6$ operations.

**What you must get right.** When you write "amortized $O(1)$", state what is being amortised over and what the worst case of a single operation is. Both halves are usually required by whoever reads your solution.

### Checkpoint

**Conceptual.**

1. Define worst-case, average-case and amortized cost, and say which one a contest time limit is based on.
2. Explain why an average-case claim is meaningless without a distribution, and give the distribution under which quicksort's $\Theta(n \log n)$ average case holds.
3. Show that the total cost of $m$ appends to a doubling array is $O(m)$, and say what the worst-case cost of a _single_ append is.

**Code reading.**

1. This function is called $10^5$ times. Give the amortized cost of one call and the worst-case cost of one call, and say which one the time limit depends on:

    ```cpp
    void push(std::vector<int>& v, int x) { v.push_back(x); }
    ```

2. This lookup is performed millions of times on a table with $10^6$ entries. Give the expected cost and the worst-case cost, and say what input would realize the worst case.

**Implementation.** Implement a dynamic array that doubles when it is full, counting the total number of elements copied across a sequence of $m$ appends. Verify that the count stays below $2m$ for $m$ up to $10^5$, and report the largest single-copy cost you observed.

**Applied problem.** A program performs $10^6$ operations on a hash map: insertions and lookups only. Give the expected total cost, the worst-case total cost, and one concrete change to the implementation that would make the worst case better. Say what each change costs.

## 2.7 Time-memory tradeoffs

Sometimes the fastest algorithm is not the one you can afford in memory, and sometimes the natural algorithm uses far more memory than the limits allow. Four tradeoffs cover nearly all contest cases.

**Precomputation.** A prefix-sum array costs $\O(n)$ time and $\O(n)$ space to build, and turns each range-sum query from $\O(n)$ into $\O(1)$. The tradeoff is memory for time, paid once.

**Rolling arrays.** A dynamic program whose recurrence reads only the previous layer can drop all but two layers. The 0/1 knapsack recurrence $dp[i][w] = \max(dp[i-1][w], dp[i-1][w - v_i] + v_i)$ reads only row $i-1$, so a one-dimensional array updated in decreasing weight order suffices: $\O(nW)$ space becomes $\O(W)$.

**Meet in the middle.** Enumerating all $2^n$ subsets costs $2^n$ time and $2^n$ memory if you store them. Splitting into two halves of $n/2$ each, generating $2^{n/2}$ sums on each side, sorting one and scanning the other, costs $O(2^{n/2} n)$ time and $O(2^{n/2})$ memory. The exponential base drops from 2 to $\sqrt{2}$, which is a huge win at $n = 40$.

**Query structures.** A segment tree answers range queries in $O(\log n)$ using $O(n)$ space. A sparse table answers the same queries in $O(1)$ using $O(n \log n)$ space, which is only worthwhile if the data is static and the number of queries is large.

The decision always comes back to the memory limit. If a problem has a 256 MB limit and a 64 MB limit, they are different problems, and the algorithm has to change.

**Worked example.** The 0/1 knapsack with $n = 1000$ items and capacity $W = 10^6$ needs a full table of $10^9$ cells, which is 8 GB and does not fit. The rolling array needs $10^6$ cells, which is 8 MB and fits comfortably. Same recurrence, same answer, factor of a thousand in memory.

**What you must get right.** Know the memory limit before you design the solution, and compute the memory of your tables before you allocate them. The most common "memory limit exceeded" in a contest is a two-dimensional array whose dimensions you multiplied in your head and did not check.

## 2.8 Why constants and language overhead matter

Big O deliberately ignores constants, which is correct for asymptotics and dangerous for real contests. Two algorithms with the same complexity class can differ by a factor of fifty, and two algorithms with different classes can differ the other way at the sizes you actually face.

The scale factors between languages are large:

- C++ performs on the order of $10^8$ simple operations per second.
- Java performs roughly an order of magnitude fewer, because of bounds checking and because the just-in-time compiler needs the program to run before it is fully optimized.
- Python performs one to two orders of magnitude fewer than C++ for tight loops, because every operation is interpreted through a dispatcher.
- JavaScript sits near Python for tight loops and much closer to Java for array-heavy work, because its optimizing compiler specializes on array element types.

So an $\O(n \log n)$ sort in C++ can beat an $\O(n)$ scan in Python. This is a real and reproducible effect, and it is the reason contest advice usually says "use C++ when you can".

Memory layout produces comparable effects. A C++ `vector<vector<int>>` stores each vertex's neighbor list in a separate allocation, so a traversal chases pointers across the heap and misses the cache. The same graph stored as two flat arrays, offsets and destinations, is contiguous and can be several times faster for exactly the same asymptotic work. That layout is called the compressed sparse row format, and it is the standard representation for large graph traversals.

::: math complexity When a constant decides
For two algorithms with costs $a\,f(n)$ and $b\,g(n)$, the larger constant wins whenever $a f(n) < b g(n)$. If $f(n) = n$ and $g(n) = n \log n$, the linear algorithm with a constant 100 times larger wins for $n < 2^{100}$, which is every $n$ that exists. This does not make the quadratic algorithm acceptable; it means that the choice between two algorithms of the _same_ complexity is a constant-factor decision, and the choice between different complexity classes is not.
:::

**Why it matters.** The decision to use C++ instead of Python is a constant-factor decision with a multiplier of ten or more. The decision to use $O(n \log n)$ instead of $O(n^2)$ is a complexity decision, and it beats any constant factor.

**Worked example.** Sorting $10^6$ random integers takes on the order of $10^8$ comparisons either way, but the same sort takes roughly three times longer in Java than in C++ and roughly ten times longer in Python. Against a 2-second limit, that difference decides acceptance.

**What you must get right.** Never choose a worse complexity class for constant factors, because the crossover point is usually astronomically far away. Do choose the language, and the data layout, once the complexity class is fixed, because there the constant is often worth a factor of ten.

### Checkpoint

**Conceptual.**

1. Give the order of magnitude of the number of simple operations per second available in C++, Java and Python, and explain where the differences come from.
2. Explain why a constant factor never rescues a worse complexity class in practice, and what the crossover argument actually shows.
3. Explain why a flat adjacency representation is faster than a nested one, and name the hardware property responsible.

**Code reading.**

1. This C++ code and its Python equivalent do the same work. Say which one you would submit under a two-second limit with $n = 10^7$, and why the choice does not depend on the asymptotic class.

    ```cpp
    for (int i = 0; i < n; i++) total += a[i] * a[i];
    ```

2. This traversal visits every edge of a graph stored as `vector<vector<int>>`. Explain why it is slower than the same traversal over flat arrays, and say what property of the memory system it depends on.

**Implementation.** Write the same sort in C++ and in Python, sort $10^6$ random integers with each, and report the two wall-clock times. Compute the ratio and say how it compares with the operation-count ratios you would expect from the language overhead alone.

**Applied problem.** A solution is $\O(n)$ and takes 1.2 seconds in C++, but the limit is also 1.2 seconds and you may submit Python. Give two changes that would make the Python submission pass, and say which of them changes the asymptotic class and which only the constant.

## 2.9 Mapping constraints to plausible algorithms

This is the module that turns analysis into action. Read the constraint before you design, and let it eliminate approaches.

| Constraint on $n$ | Alive approaches                                        |
| ----------------- | ------------------------------------------------------- |
| $n \le 10$        | $O(n!)$ enumeration                                     |
| $n \le 20$        | $O(2^n)$ with bitmasks, $O(n\,2^n)$ dynamic programming |
| $n \le 40$        | meet in the middle, $O(2^{n/2})$                        |
| $n \le 200$       | $O(n^3)$                                                |
| $n \le 2000$      | $O(n^2)$                                                |
| $n \le 10^5$      | $O(n \log n)$                                           |
| $n \le 10^6$      | $O(n \log n)$ or $O(n)$                                 |
| $n \le 10^7$      | $O(n)$                                                  |
| $n \le 10^9$      | $O(\sqrt n)$, $O(\log n)$, or $O(1)$                    |

Two refinements matter as much as the table.

**Multiple test cases.** A constraint of $\sum n_i \le 10^5$ over $10^5$ test cases means the per-case budget is tiny. An $O(n^2)$ solution can pass with $n \le 100$ per case and fail with $n \le 10^5$ per case, even though both are "quadratic".

**The size of the values.** If $n$ is large but the values are small, the structure of the values matters more than the number of them. With values in $[0, 10^6]$ you can use a counting array; with arbitrary 64-bit values you need sorting or hashing. If $n$ is around $10^9$ but the values are around $10^5$, you can sieve over the values instead of the indices.

**Why it matters.** Most wrong submissions in a contest are not incorrect. They are correct, and too slow, because the author did not check the constraint before choosing the approach.

**Worked example.** A problem says $n \le 2 \times 10^5$ and asks for the number of inversions of a permutation. The $O(n^2)$ double loop is excluded immediately: it would take about $2 \times 10^{10}$ steps. A merge-sort-based count gives $O(n \log n)$, which is about $3.6 \times 10^6$ steps.

**What you must get right.** Read the constraint first, and write down the complexity you are targeting before you write the algorithm. If you cannot name the complexity class your solution must be in, you are not ready to implement it.

### Checkpoint

**Conceptual.**

1. Given the constraint $n \le 2 \times 10^5$, name the complexity classes that remain viable and the ones that do not.
2. Explain why a constraint written as $\sum n_i \le 10^5$ is a different problem from one written as $n \le 10^5$, and give an algorithm that passes one and fails the other.
3. Explain when the size of the _values_ matters more than the size of the _index_, and give a pair of problems with the same $n$ and different solutions.

**Code reading.**

1. A proposed solution is $O(n^2)$ and the constraint is $n \le 2 \times 10^5$. Say whether it can pass, and do the arithmetic that supports your answer.

2. There are $10^5$ test cases, each with $n \le 10$, and an $O(n^2)$ solution is proposed. Say whether it can pass, and give the total number of body executions across all test cases.

**Implementation.** Write a script that takes a complexity class and a maximum input size and reports whether it is plausibly viable, using the table from this module. Test it for the pairs $(n^2, 10^3)$, $(n \log n, 10^6)$, $(2^n, 25)$ and $(n, 10^8)$, and check that each answer matches your own reasoning.

**Applied problem.** A problem states $n \le 3 \times 10^5$ and asks for the number of inversions of a permutation. State the complexity your solution must have, name two data structures that achieve it, and say which one you would implement and why.

## 2.10 Estimating memory use before implementing

Memory limits are as binding as time limits, and they are easier to reason about because they are linear in the size of your tables.

**Element sizes.** A `char` or `bool` is 1 byte, a 32-bit integer is 4 bytes, a 64-bit integer is 8 bytes, a `double` is 8 bytes, and a pointer is 8 bytes on a 64-bit machine. A `vector<bool>` in C++ is special: it packs bits and uses one bit per element, an eighth of the memory of a `vector<int>`.

**Table sizes.** Multiply. An $n \times m$ table of 32-bit integers costs $4nm$ bytes. With $n = m = 10^4$ that is 400 MB, which exceeds a typical 256 MB limit. With $n = 10^3$ and $m = 10^3$ it is 4 MB, which is fine.

**Container overhead.** A `vector<vector<int>>` of $n$ vectors costs $24n$ bytes of headers on a 64-bit C++ implementation, plus one heap allocation per inner vector. For $n = 10^6$ the headers alone are 24 MB, and the allocations make the traversal slow. The flat arrays of the compressed sparse row format cost $4(n + m)$ bytes for a graph with $n$ vertices and $m$ edges.

**Recursion.** Each frame costs some tens to some hundreds of bytes. A recursion of depth $10^5$ with 64-byte frames costs 6.4 MB of stack, which usually fits in the 8 MB default, while a depth of $10^6$ does not.

**Worked example.** You want to read $10^6$ integers and answer $10^6$ range-sum queries. Storing the values costs 4 MB, and a prefix-sum array costs 8 MB if the sums need 64 bits. A Fenwick tree over the same data costs 8 MB and answers each query in $O(\log n)$, whereas the prefix array answers each query in $O(1)$ with no extra structure. The prefix array is better here, because the data never changes.

**What you must get right.** Compute the bytes before you allocate, and prefer flat arrays over nested containers when the size is large. If the computation says the table does not fit, reduce the dimension, use a narrower type, roll the table, or find a different algorithm; there is no configuration flag that makes a 400 MB table fit in 256 MB.

### Checkpoint

**Conceptual.**

1. State the size in bytes of a `char`, a 32-bit integer, a 64-bit integer, a `double` and a pointer on a 64-bit machine.
2. Explain why `vector<vector<int>>` with $n$ inner vectors costs more than $4n$ bytes, and give the two reasons.
3. Explain why `vector<bool>` is a special case in C++ and what it costs compared with `vector<int>`.

**Code reading.**

1. Compute the memory of this structure for $n = 10^6$ and $3 \times 10^5$ edges, ignoring allocator overhead, and say what a flat compressed representation would cost:

    ```cpp
    std::vector<std::vector<int>> adj(n);
    ```

2. This recursion is used on inputs of size $10^6$. Estimate the stack it needs at 64 bytes per frame, and say what happens if the limit is 8 MB:

    ```cpp
    void solve(int i) { if (i == 0) return; solve(i - 1); }
    ```

**Implementation.** Write a program that, given a plan for storing $n$ integers, prints the estimated bytes for each of these choices: a C array of `int`, a C++ `vector<int>`, a C++ `vector<bool>`, and a Python list of `int`. Include the per-element overhead of each container, and check one of the estimates by measuring the actual process memory.

**Applied problem.** A problem has a 256 MB memory limit, $n = 5 \times 10^6$ values, and needs three different arrays of size $n$. Compute the memory of the straightforward implementation, decide whether it fits, and propose a plan that does. State what each proposal costs in time.

## Review checklist

You are ready for part 3 when you can answer the following without consulting the text.

- Explain the difference between $\O$ and $\Theta$ in terms of what each one guarantees, and give an example of a true statement that is useless as a complexity claim.
- Derive the cost of a loop whose inner bound is $i+1$, and explain why multiplying the bounds would have been wrong reasoning even when it gave the right answer.
- Solve $T(n) = 2T(n/2) + \Theta(n)$ with the master theorem and state which case applies and why.
- Explain the difference between expected $O(1)$ and amortised $O(1)$, using the dynamic array as the example for amortised and the hash table as the example for expected.
- Take a constraint of $n \le 3 \times 10^5$ and list the complexity classes that are still viable and the ones that are not.
- Compute the memory of a `vector<vector<int>>` holding the adjacency list of a graph with $10^5$ vertices and $3 \times 10^5$ edges, and say what a flat representation would cost instead.

Next: [Discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
