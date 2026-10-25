---
id: number-theory.chinese-remainder
title: Chinese remainder theorem
summary: Solve a system of congruences with pairwise coprime moduli by merging them one at a time, and recognize exactly when the same method fails.
division: [gold, platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        chinese remainder theorem,
        congruences,
        pairwise coprime,
        modular inverse,
        extended euclidean algorithm,
        system of congruences,
        least common multiple,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic]
    recommended: [foundations.recursion, number-theory.prime-factorization]
complexity:
    time: "O(k log M)"
    space: "O(1)"
assumptions:
    - The moduli are pairwise coprime, or the consistency of the system has been checked first.
    - The product of the moduli fits in the integer type being used, or the answer is reduced along the way.
reviewed: false
---

## At a glance

The Chinese remainder theorem says that a system of congruences with pairwise coprime moduli has exactly one solution modulo the product of the moduli, and the constructive proof merges two congruences at a time.

| Property | Value |
| --- | --- |
| **Problem** | Find the $x$ that satisfies $x \equiv a_i \pmod{m_i}$ for every $i$ |
| **Merge** | $x = a + m t$ with $t \equiv (b-a) m^{-1} \pmod{n}$ |
| **Time** | $O(k \log M)$ with the extended Euclidean algorithm, where $M$ is the product of the moduli |
| **Auxiliary space** | $O(1)$ |
| **Requires** | Pairwise coprime moduli, and an inverse of $m$ modulo $n$ |
| **Fails when** | The moduli share a factor, in which case the system may be inconsistent |

The word "constructive" is the important one. The theorem is not only that a solution exists; there is a short formula that produces it, and the formula is what a contest program runs.

## Problem motivation

A problem asks: "Find the smallest non-negative integer that leaves remainder $1$ when divided by $3$, remainder $2$ when divided by $5$, and remainder $3$ when divided by $7$."

The naive baseline searches. Try every $x$ from $0$ upward and check the three conditions. The answer is $52$, and the search takes $53$ steps, which is fine for this problem and is the approach to write first so that something faster has something to be checked against.

The baseline becomes useless when the moduli are larger. With moduli in the thousands, the smallest solution is around the product of the moduli, which is billions, and the search takes billions of steps. A problem with three congruences and moduli around $10^6$ has a solution of size $10^{18}$, and the search is hopeless.

The constructive method computes the answer directly. Merge the first two congruences into one, merge the third into that, and the answer falls out after a few modular inverses. The work is $O(k \log M)$ and the result does not depend on how large the answer is.

The second problem in the family is the same method used as a counting tool. "How many integers from $1$ to $10^{9}$ leave remainder $1$ when divided by $3$, remainder $2$ when divided by $5$ and remainder $3$ when divided by $7$?" The theorem says the solutions are exactly the integers congruent to $52$ modulo $105$, and the count follows from an arithmetic progression.

## Recognition patterns

The Chinese remainder theorem is the right tool when the statement contains some of these phrases.

- "Find the smallest non-negative integer that leaves remainder $r$ when divided by $m$", with two or more such conditions.
- "Solve the system of congruences", "find all $x$ such that $x \equiv a \pmod m$ and $x \equiv b \pmod n$".
- "The remainders on division by each of $m_1, \ldots, m_k$ are known".
- "Recover the original number from its residues", in a problem about encoding.
- "How many integers up to $N$ satisfy all of these conditions".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| The moduli are pairwise coprime | The theorem applies and the solution is unique modulo the product |
| The moduli are distinct primes | The theorem applies, and this is the most common contest case |
| Two moduli share a factor | The theorem does not apply, and the system may have no solution |
| The product of the moduli exceeds $10^{18}$ | The merged modulus overflows, and the answer must be reduced differently |
| The product of the moduli is at most $10^{18}$ | Everything fits in a signed 64-bit integer, and the product of the residues does too |
| Only one congruence | The theorem has nothing to merge, and the extended Euclidean algorithm is the tool |
| The answer is wanted modulo a prime $p$ | The congruences are solved modulo $p$ instead, and the moduli need not be coprime to each other |

The third row is the one that produces a wrong answer rather than a crash, and the last row is a genuinely different method that is worth knowing about.

## Naive approach

The baseline is the search.

```python
def search(moduli, residues, limit):
    for x in range(limit):
        if all(x % m == r for m, r in zip(moduli, residues)):
            return x
    return -1
```

This is correct and it is the reference implementation for a differential test. It is also the right answer when there is a single congruence.

The second baseline is the pairwise merge, done wrongly by solving the congruences independently and combining the results with a search over the first modulus. That is $O(m_1)$ work and it does not generalize to three moduli without becoming $O(m_1 m_2)$.

The third baseline is to use the extended Euclidean algorithm to find the inverse of each modulus modulo the product of the others, and then combine them with the explicit formula

$$
x = \sum_{i} a_i M_i y_i \pmod M,
\qquad M_i = \frac{M}{m_i}, \quad y_i = M_i^{-1} \bmod m_i.
$$

This is a correct one-shot method, and it is worse than the repeated merge because it computes $M$ and all the $M_i$ up front, which overflows as soon as the product is large.

## Key insight

The insight is that **two congruences can be merged into one, and the merge is a single modular inverse.**

Suppose $x \equiv a \pmod m$ and $x \equiv b \pmod n$. The first condition says that $x$ has the form $x = a + mt$ for some integer $t$. Substituting into the second gives

$$
a + mt \equiv b \pmod n,
$$

which is $mt \equiv b - a \pmod n$. When $\gcd(m, n) = 1$, the number $m$ has a multiplicative inverse modulo $n$, and multiplying both sides by it gives

$$
t \equiv (b-a) m^{-1} \pmod n.
$$

Choosing that value of $t$ and setting $x = a + mt$ produces a number that satisfies both conditions, and every solution differs from it by a multiple of $mn$. So the merged congruence is $x \equiv x_0 \pmod{mn}$, and the merge has replaced two congruences with one whose modulus is the product.

The second insight is that **the merged modulus is the product, so the process is the same whether the moduli are given as primes or as arbitrary coprime numbers.** The theorem's hypothesis is exactly the hypothesis that the inverse exists at every merge step.

The third insight is that **the solution is the smallest non-negative residue of the merged value modulo the product.** After the last merge the answer is some $x_0$, and reducing it into $[0, M)$ gives the least non-negative solution, because every other solution is $x_0 + kM$.

## Formal model

Let $m_1, \ldots, m_k$ be positive integers and $a_1, \ldots, a_k$ integers.

::: math definition Definition
The moduli $m_1, \ldots, m_k$ are **pairwise coprime** when $\gcd(m_i, m_j) = 1$ for every $i \ne j$. The **system of congruences**

$$
x \equiv a_i \pmod{m_i}, \qquad i = 1, \ldots, k,
$$

is **consistent** when it has at least one integer solution, and the **least non-negative solution** is the smallest solution in $\{0, 1, \ldots, M-1\}$ where $M = m_1 m_2 \cdots m_k$.
:::

::: math theorem Chinese remainder theorem
If $m_1, \ldots, m_k$ are pairwise coprime, then the system of congruences $x \equiv a_i \pmod{m_i}$ has exactly one solution modulo $M = m_1 \cdots m_k$. The least non-negative solution is that unique residue.
:::

::: math proof Proof
The proof is by induction on the number of congruences, and the inductive step is the merge.

The case $k = 1$ is immediate: every integer congruent to $a_1$ modulo $m_1$ is a solution, so the solutions form one residue class modulo $m_1$.

Suppose the first $k-1$ congruences have the unique solution class $x \equiv x_0 \pmod{M'}$ with $M' = m_1 \cdots m_{k-1}$. Any solution of the whole system satisfies $x \equiv x_0 \pmod{M'}$ and $x \equiv a_k \pmod {m_k}$, so $x = x_0 + M't$ for some integer $t$. Substituting into the last congruence gives $M' t \equiv a_k - x_0 \pmod{m_k}$. Since $\gcd(M', m_k) = 1$, which follows from the pairwise coprimality of the moduli, the inverse of $M'$ modulo $m_k$ exists, and $t \equiv (a_k - x_0)(M')^{-1} \pmod{m_k}$ has exactly one solution modulo $m_k$. Therefore $x$ is fixed modulo $M' m_k = M$, and the merged congruence $x \equiv x_0 + M't \pmod M$ describes the solution set completely. $\square$
:::

::: math invariant Invariant
After the merge of the first $j$ congruences, the program holds a pair $(x_j, M_j)$ with $M_j = m_1 \cdots m_j$ such that the solutions of the first $j$ congruences are exactly the integers congruent to $x_j$ modulo $M_j$. The initialization holds with $M_1 = m_1$ and $x_1 = a_1$. The merge preserves it by the argument in the theorem, and the loop ends with $(x_k, M_k)$ describing the whole system.
:::

## Algorithm derivation

The merge is three lines.

```python
from math import gcd

def extended_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x, y = extended_gcd(b, a % b)
    return g, y, x - (a // b) * y

def merge(x, m, b, n):
    g, p, _ = extended_gcd(m % n, n)
    if g != 1:
        raise ValueError("the moduli are not coprime")
    t = ((b - x) * p) % n
    return (x + m * t) % (m * n), m * n
```

The extended Euclidean algorithm returns the greatest common divisor together with the coefficients $p$ and $q$ with $ap + bq = g$. When $g = 1$, the coefficient $p$ is the inverse of $a$ modulo $b$.

The `t = ((b - x) * p) % n` line is the merge. The value of $t$ is taken modulo $n$ because only $t$ modulo $n$ matters, and the Python `%` operator returns a non-negative value, which removes the sign handling from the rest of the code.

The `x + m * t` is the merged value, and it is already in $[0, mn)$ because $0 \le x < m$ and $0 \le t < n$.

The whole system is then a fold over the congruences.

```python
def solve_crt(congruences):
    x, m = congruences[0]
    for b, n in congruences[1:]:
        x, m = merge(x, m, b, n)
    return x, m
```

The fold is left, and it does not matter whether it is left or right, because the merge is associative in the sense that the final pair describes the same solution class either way.

## Step-by-step execution

Solve the system $x \equiv 2 \pmod 5$, $x \equiv 3 \pmod 7$, $x \equiv 1 \pmod 3$.

**The first merge.** Combine $x \equiv 2 \pmod 5$ with $x \equiv 3 \pmod 7$. Here $m = 5$, $a = 2$, $n = 7$, $b = 3$. The inverse of $5$ modulo $7$ is $3$, because $5 \cdot 3 = 15 \equiv 1 \pmod 7$. So

$$
t \equiv (3 - 2) \cdot 3 \equiv 3 \pmod 7,
$$

and $x = 2 + 5 \cdot 3 = 17$. The merged congruence is $x \equiv 17 \pmod {35}$, and the check is $17 \bmod 5 = 2$ and $17 \bmod 7 = 3$.

**The second merge.** Combine $x \equiv 17 \pmod{35}$ with $x \equiv 1 \pmod 3$. Here $m = 35$, $a = 17$, $n = 3$, $b = 1$. The inverse of $35$ modulo $3$ is $2$, because $35 \equiv 2 \pmod 3$ and $2 \cdot 2 \equiv 1 \pmod 3$. So

$$
t \equiv (1 - 17) \cdot 2 \equiv -32 \equiv 1 \pmod 3,
$$

and $x = 17 + 35 \cdot 1 = 52$. The merged congruence is $x \equiv 52 \pmod {105}$.

**The answer.** The least non-negative solution is $52$, and the check is $52 = 3 \cdot 17 + 1$, $52 = 5 \cdot 10 + 2$, and $52 = 7 \cdot 7 + 3$.

**The counting version.** The integers in $[1, 10^9]$ that satisfy all three conditions are those congruent to $52$ modulo $105$, that is $52, 157, 262, \ldots$ The count is $\left\lfloor \frac{10^9 - 52}{105} \right\rfloor + 1 = 9523810$.

## Correctness proof

::: math theorem Theorem
The merge of two congruences with coprime moduli returns a pair $(x', m')$ such that the solutions of the two congruences are exactly the integers congruent to $x'$ modulo $m'$, where $m' = mn$ and $0 \le x' < m'$. The fold over the congruences therefore returns the least non-negative solution of the whole system together with the product of the moduli.
:::

::: math proof Proof
**The merge.** Let $t$ be the value computed by the merge, so that $t \equiv (b-a)p \pmod n$ where $p$ is the inverse of $m$ modulo $n$. Then $mp \equiv 1 \pmod n$, and therefore $mt \equiv m(b-a)p \equiv b - a \pmod n$. With $x' = a + mt$ this gives $x' \equiv a \pmod m$ by construction, and $x' \equiv a + (b-a) = b \pmod n$, so $x'$ satisfies both congruences.

Now let $x$ be any common solution. Then $x = a + ms$ for some integer $s$, and the second congruence gives $ms \equiv b - a \pmod n$. Multiplying by $p$ gives $s \equiv t \pmod n$, so $s = t + kn$ and $x = a + mt + kmn = x' + kmn$. Every common solution is therefore congruent to $x'$ modulo $mn$, and $x'$ itself is one, so the solution set is exactly that residue class. Because $0 \le a < m$ and $0 \le t < n$, we have $0 \le x' < mn$.

**The fold.** The invariant states that after the merge of the first $j$ congruences, the pair $(x_j, M_j)$ describes their solution set exactly. The base case holds because the solutions of $x \equiv a_1 \pmod{m_1}$ are the integers congruent to $a_1$ modulo $m_1$. Each merge preserves the invariant by the argument above, using the pairwise coprimality to justify the existence of the inverse. At the end of the fold, the pair $(x_k, M_k)$ describes the whole system, and $0 \le x_k < M_k$, so $x_k$ is the least non-negative solution. $\square$
:::

## Complexity analysis

Let $k$ be the number of congruences and $M = m_1 \cdots m_k$ the product of the moduli.

- **Time:** $O(k \log M)$. Each merge performs one extended Euclidean algorithm on numbers of size at most $M$, which is $O(\log M)$ steps, and the other operations are single multiplications and divisions of machine words.
- **Auxiliary space:** $O(1)$. The fold keeps one pair, and the extended Euclidean algorithm keeps one frame per step, so $O(\log M)$ stack in the recursive form and $O(1)$ in the iterative one.
- **Bit complexity:** the products of the moduli and the multiplications of residues are $O(\log M)$ bit operations each, so the whole computation is $O(k (\log M)^2)$ bit operations.

The $O(\log M)$ in the time bound is the cost of finding the inverse, and it is not negligible: for $M$ near $10^{18}$ it is about $60$ division steps per merge, and the merges dominate the running time.

The space is $O(1)$ only because the intermediate products fit. When the moduli are large and numerous, $M$ does not fit in a machine word, and the solution has to be kept as a list of the congruences rather than as a single number, which is a different method.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Two congruences with coprime moduli | The merge, once |
| Many congruences with pairwise coprime moduli | The fold over the merges |
| Congruences with a shared factor | The general form, with a consistency check |
| Congruences modulo a prime $p$ | The same method, with $p$ as the single modulus |
| One congruence $x \equiv a \pmod m$ | The extended Euclidean algorithm, or nothing |
| $x \equiv a \pmod m$ with a non-coprime $m$ | The extended Euclidean algorithm, which either finds a solution or proves there is none |
| The answer is wanted modulo a prime $p$ | Solve the congruences modulo $p$ directly |
| The product of the moduli overflows | Keep the congruences as a list and combine them one at a time, reducing the result |
| The number of solutions in a range | The merged modulus and an arithmetic progression |

The eighth row is a real trap. "Find the smallest $x$" with four moduli whose product is $10^{30}$ has an answer of $10^{30}$, and a program that stores the answer in a 64-bit integer reports a wrapped value that is not a solution at all.

## Recursion decision

Two recursions are involved: the extended Euclidean algorithm and the fold over the congruences. Both have bounded depth.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative for the Euclidean algorithm; the depth of at most $90$ is harmless |
| Java | About $10^4$ frames | Iterative for the Euclidean algorithm |
| Python | The interpreter limit of 1000 | Iterative; the recursive Euclidean algorithm is at most $90$ deep, but the call overhead is noticeable |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth of the recursive extended Euclidean algorithm is the number of division steps, which is at most $1 + 2\log_2(\max(m, n))$ and so at most about $120$ for a 64-bit input. No language on the list is in danger, but the iterative form is still preferable, because the recursive form pushes and pops a frame per division step and the iterative form keeps three variables.

The fold over the congruences is naturally a loop, and it should stay one. A recursive fold would have depth $k$, which is the number of congruences, and $k$ is small in every problem that uses this technique.

## Implementation walkthrough

Three lines decide whether the answer is right.

```python
g, p, _ = extended_gcd(m % n, n)
if g != 1:
    raise ValueError("the moduli are not coprime")
t = ((b - x) * p) % n
```

The `g != 1` test is the guard that keeps the theorem's hypothesis from being assumed. Without it, the program computes a "modular inverse" that does not exist, and the answer is silently wrong.

The `m % n` inside the call is an optimization. The inverse of $m$ modulo $n$ is the same as the inverse of $m \bmod n$ modulo $n$, and passing the smaller number keeps the Euclidean algorithm shallow. It also keeps the intermediate coefficients small.

The `% n` on the product is what makes the sign disappear. The value $b - x$ can be negative, and in a language whose remainder takes the sign of the dividend the product would be negative, and then $x + mt$ could be negative and the final reduction would be needed as well. With a non-negative remainder, the value of $t$ is in $[0, n)$ and $x + mt$ is automatically in $[0, mn)$.

```python
return (x + m * t) % (m * n), m * n
```

The final reduction is a safety net rather than a necessity, given the bounds on $x$ and $t$. It matters when the caller passes an $x$ that is not already reduced.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Assuming the moduli are coprime | The system may have no solution, and the program returns a wrong answer | Check the greatest common divisor, or check the consistency condition |
| Reducing $m$ before the inverse | Nothing breaks, but the Euclidean algorithm runs on larger numbers | Reduce $m$ modulo $n$ first; it is an optimization |
| Forgetting to reduce $t$ modulo $n$ | The merged value is out of range and the next merge is wrong | Take the remainder |
| Using a remainder that can be negative | The merged value is negative and the answer is wrong | Normalize the remainder |
| Computing the product of the moduli in a 32-bit type | The product overflows | Use a 64-bit type and check the bound in the statement |
| Solving the congruences independently and combining by search | The search is as slow as the original brute force | Merge them pairwise |
| Reporting the merged value without reducing it | The answer is not the least non-negative solution | Reduce into $[0, M)$ |

### Why this fails: the merge applied to moduli that share a factor

The plausible wrong approach is to apply the merge to any two congruences, because the merge is a short formula and the hypothesis of pairwise coprimality is easy to forget. The merge needs the inverse of $m$ modulo $n$, and the inverse exists exactly when the two moduli are coprime.

The smallest counterexample is the pair $x \equiv 1 \pmod 2$ and $x \equiv 2 \pmod 4$. The greatest common divisor of $2$ and $4$ is $2$, so $2$ has no inverse modulo $4$, and the extended Euclidean algorithm returns the coefficient of $1$ for $2 \cdot p + 4 \cdot q = 2$, namely $p = 1$, which satisfies $2 \cdot 1 \equiv 2 \pmod 4$ and not $2 \cdot 1 \equiv 1$.

A program that uses that coefficient anyway computes $t = (2 - 1) \cdot 1 = 1$, and then $x = 1 + 2 \cdot 1 = 3$, and reports $x \equiv 3 \pmod 8$. The value $3$ satisfies $3 \equiv 1 \pmod 2$ but $3 \equiv 3 \pmod 4$, not $2$, so the answer is wrong. And the system genuinely has no solution: the first condition forces $x$ to be odd, and the second forces $x$ to be even.

One congruence is too few to expose the bug, because the merge needs two. Two congruences with coprime moduli are the case the method is for. The pair $2$ and $4$ is the smallest pair of moduli that share a factor while remaining distinct, and it is the smallest counterexample there is.

There is a second failure in the same area, and it is the more dangerous one because the system is consistent. Take $x \equiv 1 \pmod 4$ and $x \equiv 3 \pmod 6$. The greatest common divisor is $2$, and $1 \equiv 3 \pmod 2$, so the system is consistent: the solutions are $9$ and $21$ modulo $24$, that is, $x \equiv 9 \pmod{12}$. A program that merges the two congruences and reports a single answer modulo $24$ claims a uniqueness that does not exist, and the answer it gives is one of two legitimate answers. The correct statement for non-coprime moduli is that the solution is unique modulo the least common multiple, which is $12$ and not $24$.

The lesson generalizes: **a theorem's hypothesis is part of the theorem, and the failure mode of ignoring it is a plausible answer rather than a crash.** The same shape appears in the [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) formula, where the counts of the intersections must be genuine, and in the [binomial coefficients](/algorithms/combinatorics/binomial-coefficients), where the multiplicative formula requires the modulus to be prime.

## Variants and extensions

- **The general case.** For moduli that are not pairwise coprime, the system is consistent exactly when $a_i \equiv a_j \pmod{\gcd(m_i, m_j)}$ for every pair, and the solution is unique modulo the least common multiple of the moduli.
- **A single non-coprime congruence.** $ax \equiv b \pmod m$ has a solution exactly when $\gcd(a, m)$ divides $b$, and then there are $\gcd(a, m)$ solutions modulo $m$.
- **The counting version.** The solutions in $[0, N)$ are an arithmetic progression with common difference $M$, so the count is $\left\lfloor \frac{N - 1 - x_0}{M} \right\rfloor + 1$ when $x_0 < N$, and the count in $[x_0, N]$ is $\left\lfloor \frac{N - x_0}{M} \right\rfloor
    - 1$.
- **The one-shot formula.** $x = \sum_i a_i M_i y_i \pmod M$ with $M_i = M / m_i$ and $y_i = M_i^{-1} \bmod m_i$. It is the same construction with all the merges done at once.
- **Modulo a prime instead of a product.** To solve a system modulo a prime $p$, use the same method with $p$ as the modulus, and there is no coprimality requirement at all, because the only inversion is modulo $p$.
- **The application to primality.** Factoring a number that is the product of two primes, and reconstructing it from its residues modulo those primes, is how a modulus is broken when the factorization is known.
- **The number of solutions modulo a product.** When the moduli are pairwise coprime, the number of solutions in $[0, M)$ is exactly one, and the number of solutions to a system of $k$ congruences is the product of the number of solutions to each, which is a direct use of [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) style counting.

## Contest strategy

1. Read the moduli and check whether they are pairwise coprime. If two of them share a factor, check the consistency condition before running anything.
2. Decide whether the product fits in the type being used. The statement usually guarantees it, and the guarantee is the number to look for.
3. Write the merge as a function of two congruences, and test it on $x \equiv 2 \pmod 5$ and $x \equiv 3 \pmod 7$ before writing the fold.
4. Normalize the remainder at every step, so that the merged value is never negative.
5. Reduce the final answer into $[0, M)$ and print that, not the raw merged value.
6. Test the whole system against a brute-force search over $[0, M)$ for a small case, such as the moduli $3$, $5$ and $7$.
7. When the congruences are modulo a prime rather than a product, use that prime as the modulus of a single congruence and skip the merging.

## Worked problems

### Problem 1: the three remainders

**Restatement.** Find the smallest non-negative integer that leaves remainder $1$ when divided by $3$, remainder $2$ when divided by $5$, and remainder $3$ when divided by $7$.

**Naive baseline.** Search upward from $0$ and test the three conditions, which takes $53$ steps here and is the reference implementation.

**Insight.** The moduli $3$, $5$ and $7$ are pairwise coprime, so the theorem applies and the solution is unique modulo $105$.

**Derivation.** Merge $x \equiv 2 \pmod 5$ with $x \equiv 3 \pmod 7$ to get $x \equiv 17 \pmod{35}$, then merge with $x \equiv 1 \pmod 3$ to get $x \equiv 52 \pmod{105}$.

**Correctness.** The merge theorem proves that each merged congruence describes the solution set of the congruences merged so far, and the final merge therefore describes the whole system.

**Complexity.** $O(k \log M)$ time and $O(1)$ space, which is three extended Euclidean algorithm calls on small numbers.

**Common wrong approach.** Stopping after the first merge and reporting $17$, which satisfies the first two conditions but leaves the third.

### Problem 2: counting the solutions in a range

**Restatement.** How many integers in $[1, 10^{9}]$ leave remainder $1$ when divided by $3$, remainder $2$ when divided by $5$, and remainder $3$ when divided by $7$?

**Naive baseline.** Searching the whole range, which is $10^9$ steps.

**Insight.** The solutions are one residue class modulo $105$, so they form an arithmetic progression.

**Derivation.** The merged solution class is $x \equiv x_0 \pmod M$, so the solutions in $[x_0, N]$ are the terms of the arithmetic progression $x_0, x_0 + M, x_0 + 2M, \ldots$, and their number is $\left\lfloor \frac{N - x_0}{M} \right\rfloor + 1$. Solve the system to get $x_0 = 52$ and $M = 105$, and the count is $\left\lfloor \frac{10^9 - 52}{105} \right\rfloor + 1 = 9523810$.

**Correctness.** The theorem gives the complete solution set, and the arithmetic progression counts it exactly.

**Complexity.** $O(k \log M)$ for the system and $O(1)$ for the count.

**Common wrong approach.** Dividing $10^9$ by $105$ and reporting $9523809$, which forgets that the first solution is at $52$ rather than at $0$, and that the last one is at $52 + 105 \times 9523809$.

### Problem 3: a system with a shared factor

**Restatement.** Find all integers $x$ such that $x \equiv 1 \pmod 4$ and $x \equiv 3 \pmod 6$.

**Naive baseline.** Search upward, which finds $9$ and then every multiple of $12$ apart.

**Insight.** The moduli share the factor $2$, so the theorem does not apply directly. The system is consistent because $1 \equiv 3 \pmod 2$, and the solution is unique modulo the least common multiple, which is $12$.

**Derivation.** The general merge divides out the common factor. With $m = 4$, $x = 1$, $n = 6$, $b = 3$ and $g = \gcd(4, 6) = 2$, the congruence $m t \equiv b - x \pmod n$ becomes, after dividing by $g$, $2t \equiv 1 \pmod 3$. The inverse of $2$ modulo $3$ is $2$, so $t \equiv 2 \pmod 3$, and the merged value is $x = 1 + 4 \cdot 2 = 9$. The merged modulus is the least common multiple, $\operatorname{lcm}(4, 6) = 12$, not the product $24$. The check is $9 \bmod 4 = 1$ and $9 \bmod 6 = 3$, and $21$ is the other solution in $[0, 24)$, which is exactly the $12$ that the period explains.

**Correctness.** The general merge is the same argument as the coprime merge, with the common factor divided out of both the coefficient and the right-hand side, and the merged modulus replaced by the least common multiple.

**Complexity.** $O(k \log M)$ time and $O(1)$ space.

**Common wrong approach.** Applying the coprime merge unchanged, which finds a coefficient that is not an inverse and produces a number that satisfies only one of the two conditions.

## Practice progression

1. **Recognition.** Given a statement, list the moduli, check that they are pairwise coprime, and decide whether the product fits in the type being used.
2. **Direct application.** Implement the extended Euclidean algorithm and the merge, and check the merge against a brute-force search for every pair of coprime moduli below $20$.
3. **Adaptation.** Write the general merge for non-coprime moduli, the version that reports the number of solutions in a range, and the one-shot formula with the $M_i$.
4. **Combination.** Combine the Chinese remainder theorem with [prime factorization](/algorithms/number-theory/prime-factorization) to solve a system whose moduli are given as products of primes, and with [modular arithmetic](/algorithms/number-theory/modular-arithmetic) for the inverse.
5. **Challenge.** Solve a problem with four congruences whose moduli are not pairwise coprime and where the system is consistent, and check the answer against a search over one period.
6. **Transfer.** Recognize the technique in another subject: the discrete logarithm and the index calculus, the recovery of a number from its residues in a secret-sharing scheme, and the construction of a number with prescribed digits, which is the same merge with moduli $10$ and $10^k$ handled separately.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the Chinese remainder theorem, including its hypothesis. (Formal model)
2. Derive the merge formula from the substitution $x = a + mt$. (Key insight)
3. Why does the merged modulus become the product? (Algorithm derivation)
4. What invariant does the fold maintain? (Formal model)
5. Trace the merge of $x \equiv 2 \pmod 5$ and $x \equiv 3 \pmod 7$, and then with $x \equiv 1 \pmod 3$. (Step-by-step execution)
6. Give the smallest counterexample to merging non-coprime moduli, and say what the program reports. (Common mistakes)
7. When the moduli share a factor, what replaces the product as the period of the solution set? (Common mistakes)
8. Why is the inverse of $m$ modulo $n$ the same as the inverse of $m modulo $n$ after reducing $m$? (Implementation walkthrough)
9. What is the time of the whole system, and which part of it dominates? (Complexity analysis)
10. How is the count of the solutions in a range obtained from the merged congruence? (Variants and extensions)
11. When the congruences are modulo a single prime, why is there no coprimality requirement at all? (Algorithm selection)
12. What is the depth of the recursive extended Euclidean algorithm, and is the stack ever the binding constraint? (Recursion decision)

## Further reading

- The modular inverse that the merge needs, and the extended Euclidean algorithm that computes it, are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The prime factorization of the moduli, which is what tells you whether they are pairwise coprime, is in [prime factorization](/algorithms/number-theory/prime-factorization).
- The inclusion and exclusion formula counts the solutions of a system of conditions on a universe, which is a different kind of "all the conditions at once". (Algorithm selection)
- The discrete mathematics of congruences, the greatest common divisor and the group theory behind the theorem is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index lists this technique, [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder), beside the rest of the subject: [the number theory](/algorithms/number-theory/).
