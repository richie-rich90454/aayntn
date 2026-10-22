---
id: combinatorics.binomial-coefficients
title: Binomial coefficients
summary: Count the ways to choose $k$ items from $n$ with a counting argument instead of an enumeration, and compute the count exactly or modulo a prime without overflowing.
division: [silver, gold]
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords:
    [
        binomial coefficient,
        combinations,
        pascal's identity,
        factorial,
        overflow,
        modular arithmetic,
        counting argument,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended: [foundations.binary-representation, foundations.recursion]
complexity:
    time: "O(min(k, n-k)) per value"
    space: "O(1) per value, O(k) for a Pascal table"
assumptions:
    - The $n$ items are distinct, so that the count depends only on $n$ and $k$ and not on the items themselves.
    - A modular answer is computed with a modulus that is prime, so that every value that has to be inverted is invertible.
reviewed: false
---

## At a glance

The binomial coefficient $\binom{n}{k}$ counts the $k$-element subsets of an $n$-element set. It has three useful shapes, and the choice between them is the whole subject of this article.

- **A counting argument.** Order the $k$ chosen items, count the ordered selections, and divide by $k!$, because every unordered selection was counted $k!$ times. This gives $\binom{n}{k} = \frac{n!}{k!(n-k)!}$.
- **A recurrence.** Partition the subsets by whether they contain one fixed item. This gives Pascal's identity, $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$, which fills a table in $O(nk)$ time and answers any coefficient in the table.
- **A product.** The recurrence $\binom{n}{k} = \binom{n}{k-1}\cdot\frac{n-k+1}{k}$ computes one coefficient in $O(\min(k, n-k))$ steps, and the same product computed modulo a prime gives the modular answer without ever forming the factorials.

The factorial formula is the one that fails. It needs $n!$ to fit in a machine word, and $21!$ does not, while $\binom{66}{33}$ does fit and is still far out of reach of the factorial formula.

## Problem motivation

A problem asks for the number of ways to choose $k$ of $n$ test cases to run, and states that the answer may be enormous and must be reported modulo $10^9 + 7$.

The naive baseline enumerates the subsets. There are $\binom{n}{k}$ of them, and enumerating them costs exactly the number of answers the problem asks for. At $n = 10^6$ that is a number with about $10^5$ digits, so the enumeration never finishes and the program is killed by the time limit before it prints anything.

The whole point of the subject is that the count has a **formula**. The formula is $O(\min(k, n-k))$ steps long no matter how large the answer is, because the answer is produced by arithmetic rather than by enumeration. This is the difference between the [subset enumeration](/algorithms/enumeration/subset-enumeration) and the count it is supposed to produce.

The second problem is the one the formula alone does not solve. The formula $\frac{n!}{k!(n-k)!}$ needs three factorials, and $n!$ overflows a 64-bit integer at $n = 21$. A formula that overflows is not a solution, and the fix is to compute the count modulo the prime and to replace every division with a multiplication by an inverse.

## Recognition patterns

Binomial coefficients are the right tool when the statement contains some of these phrases.

- "In how many ways", "how many distinct", "count the number of".
- "Choose", "select", "pick", with a number attached.
- "A committee of $k$ from $n$ people", "a subset of size $k$", "the number of $k$-element subsets".
- "A path on a grid", where the answer is a binomial coefficient because each path is a choice of which steps go right and which go up.
- "The answer may be large", "modulo $10^9 + 7$", together with a count.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 20$ and the exact answer is wanted | The factorial formula works |
| $n \le 66$ and the exact answer is wanted | Only the multiplicative formula works |
| $n \le 10^6$ and $k \le 10^6$, modulo a prime | The modular product is required |
| $k \ge p$ and the modulus is the prime $p$ | The simple modular product fails; use Lucas's theorem |
| Items may repeat | The formula is a multiset coefficient, not a binomial coefficient |
| Order matters | The formula is a falling factorial, not a binomial coefficient |

The last two rows are the ones that produce wrong answers rather than crashes. "Choose $k$ items from $n$, and the order of the chosen items matters" is $n(n-1)\cdots(n-k+1)$, and a program that reports $\binom{n}{k}$ is off by a factor of $k!$.

## Naive approach

The baseline enumerates the subsets and counts them.

```python
from itertools import combinations

def count_subsets(n, k):
    return sum(1 for _ in combinations(range(n), k))
```

This is correct, it is the reference implementation for the differential test, and it costs exactly $\binom{n}{k}$ steps. It is the right answer when $n$ is small, and it is the wrong answer the moment the answer is large.

The second baseline is the factorial formula, which is the formula most people write first.

```python
def binom_factorial(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))
```

In Python this is correct for every $n$, because the integers are arbitrary-precision. In a language with a fixed-width integer it is correct only while $n!$ fits, and it fails in a way that is not obvious, because the division at the end looks as though it would cancel the overflow.

## Key insight

The insight is that **counting the ordered selections and then dividing by the number of orderings of each selection gives the count of the unordered selections.**

Take $k$ of $n$ distinct items, with the order recorded. The first item can be chosen in $n$ ways, the second in $n-1$, and the $k$-th in $n-k+1$, so the number of ordered selections is $n(n-1)\cdots(n-k+1)$.

Now forget the order. Each unordered selection of $k$ distinct items has exactly $k!$ orderings, because the $k$ items can be permuted in $k!$ ways. So the number of unordered selections is

$$
\frac{n(n-1)\cdots(n-k+1)}{k!} = \frac{n!}{k!(n-k)!}.
$$

The division is exact because the argument counted each unordered selection an exact number of times. That is the whole counting argument, and it is worth repeating because the divisibility it establishes is the fact that makes the multiplicative formula legal.

The second insight is that the count satisfies a recurrence, and the recurrence has a proof by partitioning the objects being counted. Fix one item $x$. The $k$-element subsets split into those that contain $x$ and those that do not, and the two classes have sizes $\binom{n-1}{k-1}$ and $\binom{n-1}{k}$. This is a partition, so the two sizes add, and Pascal's identity follows. Every other recurrence in the subject is a consequence of a partition like this one.

## Formal model

Let $X$ be a set of $n$ distinct objects.

<MathPanel type="definition" title="Definition">
A **$k$-element subset** of $X$ is a set $S$ with $S \subseteq X$ and
$|S| = k$. The **binomial coefficient** $\binom{n}{k}$ is the number of
$k$-element subsets of an $n$-element set. It is defined to be $0$ when
$k > n$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **factorial** of a non-negative integer $n$ is $n! = n(n-1)\cdots 1$
with $0! = 1$. The two identities that connect the count to the
factorials are
$$
\binom{n}{k} = \frac{n!}{k!(n-k)!}
\qquad\text{and}\qquad
\binom{n}{k} = \binom{n}{n-k}.
$$
</MathPanel>

<MathPanel type="theorem" title="Pascal's identity">
For $1 \le k \le n$,
$$
\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k},
$$
with the boundary values $\binom{n}{0} = \binom{n}{n} = 1$.
</MathPanel>

<MathPanel type="proof" title="Proof">
Let $X$ be a set of $n$ objects and fix an object $x \in X$. Let
$\mathcal{A}$ be the family of $k$-element subsets of $X$ that contain
$x$, and let $\mathcal{B}$ be the family of those that do not.

The map that removes $x$ is a bijection from $\mathcal{A}$ to the $(k-1)$-element subsets of $X \setminus \{x\}$, which has $n-1$ elements, so $|\mathcal{A}| = \binom{n-1}{k-1}$. The identity map restricted to $\mathcal{B}$ is a bijection from $\mathcal{B}$ to the $k$-element subsets of $X \setminus \{x\}$, so $|\mathcal{B}| = \binom{n-1}{k}$.

Every $k$-element subset of $X$ either contains $x$ or does not, and the two cases are mutually exclusive, so $\mathcal{A}$ and $\mathcal{B}$ partition the family. Their sizes therefore add, which is the identity. The boundary values hold because there is exactly one empty subset and exactly one subset of size $n$, which is $X$ itself. $\square$
</MathPanel>

<MathPanel type="recurrence" title="Recurrence">
The multiplicative recurrence, for $1 \le k \le n$, is
$$
\binom{n}{k} = \binom{n}{k-1}\cdot\frac{n-k+1}{k},
\qquad\text{with}\qquad \binom{n}{0} = 1.
$$
</MathPanel>

<MathPanel type="lemma" title="Lemma">
In the recurrence above, the quantity $\binom{n}{k-1}(n-k+1)$ is divisible
by $k$, so the division is always exact.
</MathPanel>

<MathPanel type="proof" title="Proof">
The counting argument counts the $k$-element subsets of an $n$-element set
as $\frac{n!}{k!(n-k)!}$ and counts the same subsets as the number of
ordered selections divided by $k!$. Substituting the first expression into
the identity
$\binom{n}{k-1} = \frac{n!}{(k-1)!(n-k+1)!}$ and rearranging gives
$\binom{n}{k-1}(n-k+1) = k\binom{n}{k}$, and the right-hand side is a
product of integers, so the left-hand side is divisible by $k$.
$\square$
</MathPanel>

## Algorithm derivation

### The table

Pascal's identity is a table-filling rule. Fill row $n$ from row $n-1$, using one row of storage:

```cpp
std::vector<long long> pascal_row(int n, int k) {
    std::vector<long long> row(k + 1, 0);
    row[0] = 1;
    for (int i = 1; i <= n; ++i) {
        for (int j = std::min(i, k); j >= 1; --j) {
            row[j] += row[j - 1];   // the descending loop is the point
        }
    }
    return row;
}
```

The inner loop runs downwards. Running it upwards would read the value that the same iteration has already updated, and the table would fill with powers of two instead of binomial coefficients.

### The multiplicative form, exactly

```cpp
long long binom_exact(long long n, long long k) {
    if (k < 0 || k > n) return 0;
    k = std::min(k, n - k);          // symmetry halves the work
    long long result = 1;
    for (long long i = 1; i <= k; ++i) {
        result = result * (n - k + i) / i;   // multiply first, then divide
    }
    return result;
}
```

The multiplication happens before the division because the division is exact only after the multiplication, by the lemma. Doing it the other way round, `result / i * (n - k + i)`, divides before the numerator has been multiplied in, and the quotient is generally not an integer.

### The modular form

```cpp
long long binom_mod(long long n, long long k, long long p) {
    if (k < 0 || k > n) return 0;
    k = std::min(k, n - k);
    long long num = 1, den = 1;
    for (long long i = 1; i <= k; ++i) {
        num = num * (n - k + i) % p;
        den = den * i % p;
    }
    return num * mod_inverse(den, p) % p;
}
```

The numerator and the denominator are accumulated separately and a single inverse is taken at the end, which costs $O(k + \log p)$ modular multiplications instead of $O(k \log p)$. The requirement is that the denominator is invertible, which holds when $k < p$ and $p$ is prime, because then $k!$ has no factor of $p$.

The arithmetic inside the loop needs care. `num * (n - k + i)` can be larger than the modulus squared, so with a modulus near $10^9 + 7$ the product is below about $10^{18}$ and a signed 64-bit integer holds it, while a modulus near $2^{61}$ needs a 128-bit intermediate.

## Step-by-step execution

**Pascal's table, first six rows.** Each entry is the sum of the two below it.

| $n \backslash k$ | 0   | 1   | 2   | 3   | 4   | 5   |
| ---------------- | --- | --- | --- | --- | --- | --- |
| 0                | 1   |     |     |     |     |     |
| 1                | 1   | 1   |     |     |     |     |
| 2                | 1   | 2   | 1   |     |     |     |
| 3                | 1   | 3   | 3   | 1   |     |     |
| 4                | 1   | 4   | 6   | 4   | 1   |     |
| 5                | 1   | 5   | 10  | 10  | 5   | 1   |

Row 4 is where the recurrence does its first real work: $\binom{4}{2} = \binom{3}{1} + \binom{3}{2} = 3 + 3 = 6$.

**The multiplicative form, computing $\binom{6}{3}$.** With $k = \min(3, 6-3) = 3$, the loop runs three times.

| $i$ | Numerator before the division | Result        |
| --- | ----------------------------- | ------------- |
| 1   | $1 \times (6-3+1) = 4$        | $4 / 1 = 4$   |
| 2   | $4 \times 5 = 20$             | $20 / 2 = 10$ |
| 3   | $10 \times 6 = 60$            | $60 / 3 = 20$ |

The result is $20$, which is $\binom{6}{3}$. Note that the running value after each step is $\binom{6}{i}$, so the division is exact at every step by the lemma.

**The modular form, computing $\binom{10}{3} \bmod 7$.** The exact value is $120$, and $120 \bmod 7 = 1$.

| Step    | `num`                          | `den`            |
| ------- | ------------------------------ | ---------------- |
| start   | 1                              | 1                |
| $i = 1$ | $1 \times 8 = 8 \bmod 7 = 1$   | $1 \times 1 = 1$ |
| $i = 2$ | $1 \times 9 = 9 \bmod 7 = 2$   | $1 \times 2 = 2$ |
| $i = 3$ | $2 \times 10 = 20 \bmod 7 = 6$ | $2 \times 3 = 6$ |

Now $6 \times 6^{-1} \equiv 6 \times 6 = 36 \equiv 1 \pmod 7$, because $6 \times 6 = 36 = 35 + 1$. The answer is $1$, which agrees with $120 \bmod 7$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
For $0 \le k \le n$, the counting argument gives
$\binom{n}{k} = \frac{n!}{k!(n-k)!}$, and the multiplicative recurrence
computes that value exactly.
</MathPanel>

<MathPanel type="proof" title="Proof">
**The counting argument.** Consider the ordered $k$-tuples of distinct
elements of $X$. There are $n$ choices for the first position, $n-1$ for
the second, and $n-k+1$ for the last, so there are
$n(n-1)\cdots(n-k+1) = \frac{n!}{(n-k)!}$ of them. Every $k$-element
subset has exactly $k!$ orderings, because its elements are distinct, and
every ordered tuple is the ordering of exactly one $k$-element subset. The
map from ordered tuples to the underlying subset is therefore a union of
fibers of size $k!$, so the number of subsets is
$\frac{n!}{(n-k)!k!}$.

**The recurrence.** After iteration $i$, the running value equals $\binom{n}{i}$. At $i = 0$ it is $1 = \binom{n}{0}$. Suppose it equals $\binom{n}{i-1}$ at the start of iteration $i$. The step multiplies it by $n-k+i$ and divides by $i$, and the lemma shows the division is exact, so the new value is

$$
\binom{n}{i-1}\cdot\frac{n-k+i}{i} = \binom{n}{i},
$$

where the last equality is the recurrence. By induction the loop ends with $\binom{n}{k}$. $\square$
</MathPanel>

<MathPanel type="theorem" title="Theorem">
When $p$ is prime and $k < p$, the modular computation returns
$\binom{n}{k} \bmod p$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The loop accumulates
$$
\text{num} \equiv \prod_{i=1}^{k}(n-k+i) = \frac{n!}{(n-k)!}
\quad\text{and}\quad
\text{den} \equiv k! \pmod p.
$$
Since $k < p$ and $p$ is prime, none of $1, 2, \ldots, k$ is divisible by
$p$, so $k! \not\equiv 0 \pmod p$ and the inverse of `den` exists. In the
field of residues modulo $p$ the division is therefore exact, and
$$
\text{num} \cdot \text{den}^{-1}
\equiv \frac{n!}{(n-k)!}\cdot(k!)^{-1}
\equiv \binom{n}{k} \pmod p,
$$
because the integer identity
$\binom{n}{k}(k!)(n-k)! = n!$ holds and every factor on the right is
invertible. $\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
After iteration $i$ of the multiplicative loop, the running value equals
$\binom{n}{i}$, and in the modular loop the accumulators equal
$\frac{n!}{(n-k)! \cdot i!}$ and $i!$ modulo $p$.
</MathPanel>

## Complexity analysis

| Method                  | Time              | Space  | Requirement                    |
| ----------------------- | ----------------- | ------ | ------------------------------ |
| Enumeration             | $\binom{n}{k}$    | $O(1)$ | Nothing, but it never finishes |
| Factorial formula       | $O(n)$            | $O(1)$ | $n!$ must fit, so $n \le 20$   |
| Multiplicative, exact   | $O(\min(k, n-k))$ | $O(1)$ | The answer must fit            |
| Pascal's table          | $O(nk)$           | $O(k)$ | Every entry must fit           |
| Multiplicative, modular | $O(k + \log p)$   | $O(1)$ | $k < p$, and $p$ prime         |

The contrast between the first two rows and the fourth is the whole subject. The factorial formula needs $n!$ to fit in a 64-bit integer, and $21! \approx 5.11 \times 10^{19}$ exceeds the maximum of about $9.22 \times 10^{18}$, so the factorial formula is usable only up to $n = 20$. The multiplicative formula needs only the answer to fit, and the answer fits far longer: $\binom{66}{33} = 7219428434016265740$ is the largest binomial coefficient that fits in a signed 64-bit integer, because $\binom{67}{33} = 14226520737620288370$ does not.

A contest problem that asks for the answer modulo a prime is therefore answered by the modular product, and the modular product is the only method in the table that has no size limit at all.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One exact coefficient, small $n$ | The factorial formula |
| One exact coefficient, $n \le 66$ | The multiplicative formula |
| One coefficient modulo a prime, $k < p$ | The modular product |
| One coefficient modulo a prime, $k \ge p$ | Lucas's theorem |
| Every coefficient of one row | Pascal's table |
| Every coefficient up to $n$ | Pascal's table, $O(n^2)$ |
| Items may repeat | The multiset coefficient $\binom{n+k-1}{k}$ |
| Order matters | The falling factorial $n(n-1)\cdots(n-k+1)$ |
| The count is one term of a sum | The hockey-stick identity, or a dynamic program |
| A count that must be reduced | [Modular arithmetic](/algorithms/number-theory/modular-arithmetic) |

## Recursion decision

Pascal's identity is a recursion, and the natural recursive formulation is $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$. Its depth is $n$, and without memoization it visits $\binom{n}{k}$ leaves, which is exactly the enumeration the subject exists to avoid.

The memoized version has the same cost as the table, $O(nk)$ time and $O(nk)$ space, and a recursion depth of $n$. Neither is better than the one-row table, which is $O(nk)$ time and $O(k)$ space with no stack at all.

| Language   | Practical depth                      | Recommendation                    |
| ---------- | ------------------------------------ | --------------------------------- |
| C and C++  | About $10^5$ frames on an 8 MB stack | Iterative, since $n$ can be large |
| Java       | About $10^4$ frames                  | Iterative                         |
| Python     | The interpreter limit of 1000        | Iterative                         |
| Pascal     | The operating system stack           | Iterative                         |
| JavaScript | About $10^4$ frames                  | Iterative                         |

The multiplicative formula has no recursion at all, and it is the form that should be written by hand. The table has none either, and the descending inner loop is the only thing that has to be remembered.

## Implementation walkthrough

The three lines that decide whether the answer is right.

```cpp
result = result * (n - k + i) / i;    // multiply, then divide
k = std::min(k, n - k);               // symmetry halves the work
row[j] += row[j - 1];                  // the loop must run downwards
```

The first line must multiply before it divides. The quotient `result / i` is generally not an integer, so dividing first truncates and the answer is wrong from the second iteration onward.

The second line is the symmetry $\binom{n}{k} = \binom{n}{n-k}$, and it halves the loop. It also reduces $k$, which matters for the modular form, because the requirement is $k < p$.

The third line must run downwards. An upwards loop reads the entry it has already updated in this same iteration, and the table fills with $2^i$ instead of binomial coefficients. This is the single most common bug in Pascal's triangle code, and it produces a table that looks plausible.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Dividing before multiplying | The quotient truncates and the answer is wrong | Multiply, then divide |
| Running the Pascal loop upwards | The table fills with powers of two | Run the inner loop downwards |
| Using the factorial formula in a fixed-width type | The factorial overflows and the answer is garbage | Use the multiplicative formula |
| Dividing modulo a prime when $k \ge p$ | The inverse does not exist | Use Lucas's theorem, or reduce $k$ first |
| Forgetting the symmetry | The loop is twice as long as it needs to be | Set $k = \min(k, n-k)$ |
| Using floating point | The running value exceeds $2^{53}$ and loses exactness | Use an integer type |
| Reporting $\binom{n}{k}$ when order matters | The answer is too small by a factor of $k!$ | Decide whether order matters first |

### Why this fails: the factorial that overflows before the answer does

The plausible wrong approach is to use the formula everyone remembers, $\binom{n}{k} = \frac{n!}{k!(n-k)!}$, and to trust that the division at the end cancels whatever the multiplication made too large. It does not: the overflow happens while the factorial is being formed, and the value that overflows is the one being divided.

The smallest counterexample is $n = 21$, $k = 10$. The exact answer is $\binom{21}{10} = 352716$, which fits in any integer type. But $21! = 51090942171709440000$, which exceeds the maximum signed 64-bit integer of $9223372036854775807$, while $20! = 2432902008176640000$ fits. So $21$ is the smallest $n$ at which the factorial formula breaks, and the answer at that $n$ is a small number that the correct method computes without any difficulty.

The failure is silent. The program divides an overflowed value by another overflowed value and prints a number. The number is not obviously absurd, and it changes with the modulus of the machine word, which means the same program gives different answers on different machines.

The point is worse than the individual case, because the factorial formula is far more limited than the answer needs to be. The largest binomial coefficient that fits in a signed 64-bit integer is $\binom{66}{33} = 7219428434016265740$, so an exact answer is representable for $n$ up to $66$, while the factorial formula only works for $n$ up to $20$. The multiplicative formula bridges exactly that gap, because it never forms a factorial at all.

A second counterexample in the same family shows that the fix has its own condition. The modular product divides by $k!$, which is invertible only when $k < p$. The smallest failure is the prime modulus $p = 2$ with $n = 4$ and $k = 2$. The exact answer is $\binom{4}{2} = 6$, and $6 \bmod 2 = 0$. The modular computation forms the denominator $k! = 2$, which is $0$ modulo $2$, and its inverse does not exist, so the program divides by zero and crashes. The answer is $0$, and the correct way to get it is to notice that the numerator $4 \times 3 = 12$ is already $0$ modulo $2$.

The lesson generalizes: **a formula is only as good as the range in which its divisions are legal.** The counting argument is not in doubt; what fails is the machine's ability to hold the intermediates, and the fix is to choose a formula whose intermediates are small.

## Variants and extensions

- **Multiset coefficients.** Choosing $k$ items from $n$ types with repetition allowed gives $\binom{n+k-1}{k}$, by the stars-and-bars bijection.
- **The hockey-stick identity.** $\sum_{i=k}^{n}\binom{i}{k} = \binom{n+1}{k+1}$, which sums a diagonal of Pascal's triangle in closed form.
- **Vandermonde's identity.** $\binom{m+n}{k} = \sum_{i}\binom{m}{i}\binom{n}{k-i}$, which counts a $k$-subset of a union by how it splits.
- **Lucas's theorem.** For a prime $p$, write $n$ and $k$ in base $p$ as $n = \sum n_i p^i$ and $k = \sum k_i p^i$. Then $\binom{n}{k} \equiv \prod_i \binom{n_i}{k_i} \pmod p$. It is the answer when $k$ can be at least $p$.
- **The binomial theorem.** $\sum_k \binom{n}{k} x^k y^{n-k} = (x+y)^n$, which turns a counting argument into an algebraic one and is the basis of the generating-function method.
- **Pascal's triangle modulo a prime.** The table is also a table of inverses: the entry in row $n$, column $k$ is the coefficient of $x^k$ in $(1+x)^n$.

## Contest strategy

1. Decide two things before writing anything: whether the items are distinct, and whether the order of the chosen items matters. Every counting formula depends on those two answers.
2. Decide whether the answer is exact or reduced. The exact answer and the modular answer need different code, and the exact answer may not fit at all.
3. Never form a factorial in a fixed-width integer. If the exact answer is wanted, use the multiplicative formula.
4. Apply the symmetry first. It halves the loop, and it reduces $k$, which is what makes the modular form legal.
5. If the modulus is prime and $k$ might be at least the modulus, stop and use Lucas's theorem rather than the simple product.
6. When in doubt, write the enumeration first and use it as the reference. A disagreement between the enumeration and the formula on small inputs is the fastest way to find a sign error or a reversed loop.

## Worked problems

### Problem 1: the number of committees

**Restatement.** Given $n$ people, report the number of committees of size $k$, exactly.

**Naive baseline.** Enumerate the subsets, which costs $\binom{n}{k}$ steps.

**Insight.** The counting argument gives a closed form, and the multiplicative recurrence evaluates it in $\min(k, n-k)$ steps.

**Derivation.** Apply the symmetry, then run the multiplicative loop.

**Correctness.** The counting argument proves the formula, and the induction on the loop proves the loop computes it.

**Complexity.** $O(\min(k, n-k))$ time and $O(1)$ space.

**Common wrong approach.** The factorial formula in a 64-bit type, which fails at $n = 21$ even though the answer is small.

### Problem 2: a binomial coefficient modulo a prime

**Restatement.** Given $n \le 10^6$, $k \le 10^6$, and a prime modulus $p = 10^9 + 7$, report $\binom{n}{k} \bmod p$.

**Naive baseline.** The factorial formula, which overflows and then divides incorrectly.

**Insight.** The same multiplicative recurrence works in the field of residues, and the only division is by $k!$, which is invertible because $k < p$.

**Derivation.** Accumulate the numerator and the denominator modulo $p$, then multiply by the inverse of the denominator.

**Correctness.** The theorem above proves that the modular computation returns the residue of the exact value.

**Complexity.** $O(k + \log p)$ time and $O(1)$ space.

**Common wrong approach.** Dividing by the modular inverse of a nonzero-looking denominator without checking that $k < p$, which is the counterexample $p = 2$, $n = 4$, $k = 2$.

### Problem 3: paths on a grid

**Restatement.** A grid is $a$ rows by $b$ columns, and a path may move only right or down. Report the number of paths from the top-left corner to the bottom-right corner, modulo $p$.

**Naive baseline.** A dynamic program over the grid, $O(ab)$ time and $O(b)$ space, which is also the standard way to do it.

**Insight.** Every path uses exactly $a-1$ downward moves and $b-1$ rightward moves, so a path is a choice of which $a-1$ of the $a+b-2$ steps are the downward ones. The count is $\binom{a+b-2}{a-1}$.

**Derivation.** Compute the binomial coefficient with the modular product.

**Correctness.** The bijection between paths and step sequences is exact: choosing the positions of the downward steps determines the path completely, and every path determines those positions.

**Complexity.** $O(\min(a, b) + \log p)$ time, against $O(ab)$ for the dynamic program. At $a = b = 10^6$ that is the difference between $10^{12}$ steps and about $10^6$.

**Common wrong approach.** Reporting $2^{a+b-2}$, the number of step sequences without the constraint on how many of each kind there are. It is wrong by the factor $\binom{a+b-2}{a-1}$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the items are distinct, whether order matters, and whether the answer is exact or reduced.
2. **Direct application.** Implement the factorial formula, the multiplicative formula, and the modular product, and check all three against each other for every $n \le 20$.
3. **Adaptation.** Write the multiset coefficient, the falling factorial, and the version that computes a whole row of Pascal's triangle with $O(k)$ space.
4. **Combination.** Use the binomial theorem or the hockey-stick identity to sum a diagonal of Pascal's triangle, and use Lucas's theorem to handle a prime modulus smaller than $k$.
5. **Challenge.** Solve a problem where the count is a sum of binomial coefficients with different upper limits, and decide whether the hockey stick applies or a dynamic program is needed.
6. **Transfer.** Recognize a counting problem in another subject as a binomial coefficient: a grid path, a committee, a bit string with a given number of ones, or the number of ways to interleave two sequences. Where the count must be reduced, use [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the counting argument for $\binom{n}{k}$ and say why the division by $k!$ is exact. (Key insight)
2. State Pascal's identity and give the partition that proves it. (Formal model)
3. Why is the division in the multiplicative recurrence always exact? (Formal model)
4. Trace the multiplicative loop for $\binom{6}{3}$ and say what the running value is after each step. (Step-by-step execution)
5. What is the largest $n$ for which the factorial formula works, and what is the largest $n$ for which the exact answer fits? (Complexity analysis)
6. What is the smallest input on which the factorial formula breaks, and what is the correct answer there? (Common mistakes)
7. Why must the inner loop of Pascal's table run downwards? (Implementation walkthrough)
8. What condition does the modular product require, and what is the smallest input on which it fails? (Common mistakes)
9. When does order matter, and what formula does the problem need then? (Recognition patterns)
10. Why is the recursive formulation of Pascal's identity the one to avoid? (Recursion decision)

## Further reading

- The arithmetic that reduces a huge count modulo a prime, and the inverse that the modular product needs, are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The discrete mathematics behind the counting argument, the partition and the divisibility is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The enumeration that the count replaces, and the reference implementation that catches a mistake in the formula, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The search over a tree of choices, which is the alternative when the constraints are local rather than a count, is in [backtracking](/algorithms/enumeration/backtracking).
- The dynamic program that counts the increasing subsequences, whose count must usually be reduced, is in [longest increasing subsequence](/algorithms/dynamic-programming/longest-increasing-subsequence).
- The dynamic program whose answer is a count over the items, and is usually reported modulo a prime, is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The string search whose prefix function counts the occurrences of a pattern inside itself, which is the same counting idea applied to strings, is in [KMP](/algorithms/strings/kmp).
- The number of lattice points inside a polygon is counted from its hull and from a congruence, so the geometry of the subject meets this counting in [convex hull](/algorithms/geometry/convex-hull).
- A count that depends on a monotone condition over many candidates is often found by an offline batch of binary searches, which is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The subject index lists this technique, [binomial coefficients](/algorithms/combinatorics/binomial-coefficients), beside the counting arguments it does not yet cover: [the combinatorics](/algorithms/combinatorics/).
