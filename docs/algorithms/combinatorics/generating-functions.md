---
id: combinatorics.generating-functions
title: Generating functions
summary: Encode a count as the coefficient of a formal power series, so that multiplication does the convolution and a rational function encodes a linear recurrence.
division: [gold, platinum]
subjects: [combinatorics]
level: advanced
importance: advanced-technique
keywords:
    [
        generating function,
        coefficient extraction,
        formal power series,
        geometric series,
        binomial theorem,
        convolution,
        linear recurrence,
        rational function,
    ]
prerequisites:
    required: [combinatorics.binomial-coefficients]
    recommended:
        [combinatorics.counting-dp, number-theory.modular-arithmetic, foundations.recursion]
complexity:
    time: "O(nk) for the dynamic program"
    space: "O(n)"
assumptions:
    - The counts are finite for every total, so that the series is a well-defined formal power series.
    - The arithmetic is performed in a ring, so that the identities hold as identities of formal series.
reviewed: false
---

## At a glance

A generating function is a formal power series whose coefficient of $x^n$ is the count of the configurations of total weight $n$. Multiplying two generating functions convolves their coefficients, which is exactly what combining two independent choices does.

| Property | Value |
| --- | --- |
| **Problem** | Count the configurations whose total weight is a given value |
| **Encoding** | $F(x) = \sum_{n \ge 0} f(n) x^n$, where $f(n)$ is the count of weight $n$ |
| **Combination** | $(F \cdot G)(x^n) = \sum_{i=0}^{n} f(i) g(n-i)$ |
| **The geometric series** | $\frac{1}{1-x} = \sum_{i \ge 0} x^i$ |
| **The binomial theorem** | $(1+x)^n = \sum_{k=0}^{n} \binom{n}{k} x^k$ |
| **Time** | $O(nk)$ for $k$ factors by dynamic programming, $O(n \log n)$ by a fast convolution |
| **Auxiliary space** | $O(n)$ |
| **Requires** | A weight that is additive, and a finite count for each weight |
| **Fails when** | The order of the choices matters, because the product counts unordered choices |

The last row is the boundary between this technique and its cousin. A product of factors counts a **multiset** of choices, one from each factor. When the order of the choices matters, the encoding is different, and the difference shows up in the very first example.

## Problem motivation

A vending machine accepts coins of value $1$, $3$ and $4$. How many ways are there to make $n$ cents? The answer is a sequence $f(0), f(1), f(2), \ldots$ that satisfies a recurrence, because a way to make $n$ cents ends with a coin of value $1$, $3$ or $4$.

The dynamic program computes the sequence in $O(n)$ time, one entry at a time. That is fast enough, and it is the approach described in [counting dynamic programming](/algorithms/combinatorics/counting-dp). The generating function is the other way of looking at the same sequence, and it is worth learning for two reasons.

The first reason is that the generating function exposes the **structure** of the count. The sequence for the vending machine turns out to be the coefficient list of a rational function with a denominator of degree $3$, and the denominator predicts the recurrence that the sequence satisfies. A problem that gives a recurrence and asks for a closed form, or a problem that gives a generating function and asks for a recurrence, is answered by looking at the denominator.

The second reason is that the generating function makes **combinations automatic**. The number of ways to make $n$ cents with coins of value $1$ and $3$ is the coefficient of $x^n$ in $\frac{1}{(1-x)(1-x^3)}$, and the number of ways to make $n$ cents with coins of value $1$, $3$ and $4$ is the coefficient of $x^n$ in $\frac{1}{(1-x)(1-x^3)(1-x^4)}$. The two answers differ by one factor in the denominator, and there is no other difference in the derivation. When a problem has several kinds of items, the factors multiply and the reasoning does not change.

## Recognition patterns

Generating functions are the right tool when the statement contains some of these phrases.

- "In how many ways can you make $n$", "make change for $n$", "pay for an item using coins of denominations".
- "How many nonnegative integer solutions does $a_1x_1 + \cdots + a_kx_k = n$ have?"
- "How many multisets", "combinations with repetition".
- "The number of ways to tile a board of length $n$ with tiles of lengths $a_1, \ldots, a_k$".
- "The number of strings of length $n$ over an alphabet of size $k$ that avoid a pattern".
- A linear recurrence with constant coefficients, and a request for a closed form or for a large index.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $n \le 10^6$ and $k \le 10$ | The coefficient list is computed by the dynamic program in $O(nk)$ |
| $n \le 10^6$ and $k \le 10^6$ | The naive convolution is $O(n^2)$ and a fast convolution is required |
| $n$ is small and the answer is wanted exactly | The coefficients are computed as exact integers |
| The answer is wanted modulo a prime | Every operation is done in the residues, and the coefficients are reduced as they are produced |
| The number of item types is fixed and small | The rational function has a small denominator, and the recurrence has small order |
| The number of item types is large | The denominator is large, and the product of the factors is the only way to get the coefficient |
| The choices must be ordered | The product does not apply, and the geometric series for ordered sequences is used instead |

The last row is the one that produces a wrong answer rather than a slow one, and it is worth having the two cases side by side.

## Naive approach

The baseline computes the counts one weight at a time.

```python
def make_change(n, coins):
    ways = [0] * (n + 1)
    ways[0] = 1
    for coin in coins:
        for total in range(coin, n + 1):
            ways[total] += ways[total - coin]
    return ways[n]
```

This is correct and it is the dynamic program. The order of the two loops matters: with the coin loop outside, each coin type is used any number of times and the order of the coins is not counted, which is the multiset count. With the total loop outside, the order of the coins is counted, which is the ordered count.

The second baseline, and the one that the generating function replaces, is to write the counts as a table by hand and look for a pattern. It works for small $n$ and it is how most people meet the subject.

## Key insight

The insight is that **a formal power series is a package of infinitely many counts, and multiplying two packages convolves the counts.**

Define the generating function of a sequence $f$ by

$$
F(x) = f(0) + f(1)x + f(2)x^2 + \cdots = \sum_{n \ge 0} f(n) x^n.
$$

The coefficient of $x^n$ in the product $F(x)G(x)$ is $\sum_{i=0}^{n} f(i) g(n-i)$, because the only way to get $x^n$ from a product is to take $x^i$ from the first factor and $x^{n-i}$ from the second. That sum is exactly the count of the configurations that use a configuration of weight $i$ from the first family and one of weight $n-i$ from the second. So the product of the generating functions counts the combined choices.

The two identities that make the subject work are these.

**The geometric series.** For a family of items that can be used any number of times, each contributing weight $w$, the generating function is $1 + x^w + x^{2w} + \cdots = \frac{1}{1-x^w}$. The coefficient of $x^n$ is $1$ for every $n$ that is a multiple of $w$ and $0$ otherwise, which is the count of the ways to use that item type alone: there is exactly one way to use it $j$ times, for each valid $j$.

**The binomial theorem.** $(1+x)^n = \sum_{k=0}^{n} \binom{n}{k} x^k$. The factor $1+x$ encodes a binary choice, "take it or do not take it", and raising to the $n$-th power encodes $n$ independent binary choices. The coefficient of $x^k$ is the number of ways to make $k$ choices out of $n$, which is the binomial coefficient. The identity is a statement about polynomials and it holds in every ring, which is what makes it usable modulo a prime.

These two identities compose. The generating function of the ways to make $n$ cents with coins of value $1$, $3$ and $4$ is

$$
\frac{1}{(1-x)(1-x^3)(1-x^4)},
$$

because the three factors are the three independent choices of how many coins of each value to use, and the coefficient of $x^n$ counts the combinations of those three choices whose values sum to $n$.

## Formal model

<MathPanel type="definition" title="Definition">
A **formal power series** over a ring $R$ is a sequence
$(a_0, a_1, a_2, \ldots)$ of elements of $R$, written
$F(x) = \sum_{n \ge 0} a_n x^n$. Multiplication is defined by the
convolution
$$
(F \cdot G)(x^n) = \sum_{i=0}^{n} a_i b_{n-i},
$$
and it is associative and commutative because convolution is.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **generating function** of a counting problem is the series whose
coefficient of $x^n$ is the number of valid configurations of total weight
$n$. For a family of item types with weights $w_1, \ldots, w_k$, each
usable any number of times, it is
$$
F(x) = \prod_{i=1}^{k} \frac{1}{1 - x^{w_i}},
$$
and the answer for total weight $n$ is the coefficient $[x^n] F(x)$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $A$ be a family of configurations of weight $i$ counted by $a_i$, and
let $B$ be a family of configurations of weight $j$ counted by $b_j$. The
number of combined configurations of weight $n$, one from each family, is
the coefficient of $x^n$ in the product of the two generating functions.
</MathPanel>

<MathPanel type="proof" title="Proof">
A combined configuration of weight $n$ determines uniquely a pair
$(p, q)$ with $p$ in $A$ and $q$ in $B$ such that the weight of $p$ plus
the weight of $q$ is $n$. For a fixed weight $i$ of $p$, there are $a_i$
choices for $p$ and $b_{n-i}$ choices for $q$, so the number of pairs with
$p$ of weight $i$ is $a_i b_{n-i}$. Summing over $i$ from $0$ to $n$ gives
$\sum_{i=0}^{n} a_i b_{n-i}$, which by the definition of multiplication of
formal power series is the coefficient of $x^n$ in the product. $\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
In the coefficient-by-coefficient multiplication of two series, after the
inner loop has processed the term of degree $k$, the entry for degree $k$
holds $\sum_{i=0}^{k} a_i b_{k-i}$ reduced modulo the modulus, which is the
coefficient of $x^k$ in the product. The entry is never read again, so the
reduction is safe and the table can be reused for the next factor.
</MathPanel>

## Algorithm derivation

There are three ways to get the coefficients, and they are worth telling apart.

**The dynamic program.** Expand the product one factor at a time, keeping the coefficient list of the partial product.

```python
def make_change(n, coins, mod=10**9 + 7):
    ways = [0] * (n + 1)
    ways[0] = 1
    for coin in coins:
        for total in range(coin, n + 1):
            ways[total] = (ways[total] + ways[total - coin]) % mod
    return ways[n]
```

This is the coefficient list of $\prod_i (1 - x^{w_i})^{-1}$ computed one factor at a time, and it costs $O(nk)$ time and $O(n)$ space. The inner loop runs upward, which is what lets a coin type be used more than once.

**Direct multiplication.** Multiply two coefficient lists by convolution.

```python
def multiply(a, b, mod=10**9 + 7):
    out = [0] * (len(a) + len(b) - 1)
    for i, ai in enumerate(a):
        for j, bj in enumerate(b):
            out[i + j] = (out[i + j] + ai * bj) % mod
    return out
```

This is $O(nm)$ for two lists of length $n$ and $m$. It is the operation a fast convolution improves, and with an NTT it becomes $O(n \log n)$ per multiplication, at the cost of requiring a modulus with a suitable root of unity.

**The recurrence.** When the generating function is rational, $F(x) = P(x)/Q(x)$ with $Q(x) = 1 + q_1 x + \cdots + q_d x^d$, then comparing coefficients in $Q(x) F(x) = P(x)$ gives the recurrence

$$
f(n) = -q_1 f(n-1) - q_2 f(n-2) - \cdots - q_d f(n-d) + p_n.
$$

The order $d$ of the recurrence is the degree of the denominator, and it is usually much smaller than $n$.

## Step-by-step execution

Take coins of value $1$, $3$ and $4$, and count the ways to make $n = 6$.

**The factors.** The coin of value $1$ contributes $\frac{1}{1-x} = 1 + x + x^2 + x^3 + \cdots$. The coin of value $3$ contributes $\frac{1}{1-x^3} = 1 + x^3 + x^6 + \cdots$. The coin of value $4$ contributes $\frac{1}{1-x^4} = 1 + x^4 + x^8 + \cdots$.

**The product.** Multiply the first two: $\frac{1}{(1-x)(1-x^3)} = 1 + x + x^2 + 2x^3 + x^4 + 2x^5 + 2x^6 + \cdots$. The coefficient of $x^3$ is $2$, from the ways $\{1,1,1\}$ and $\{3\}$; the coefficient of $x^6$ is $2$, from $\{1,1,1,1,1,1\}$ and $\{3,3\}$.

**The third factor.** Multiply by $\frac{1}{1-x^4} = 1 + x^4 + \cdots$. The coefficient of $x^6$ in the product is the sum of the coefficients of $x^6$ and of $x^2$ in the first two factors, which is $2 + 1 = 3$.

**The answer.** The three ways to make $6$ cents are $1+1+1+1+1+1$, $3+3$, and $1+1+4$. The order of the coins is not counted, which is what the product encodes.

**The ordered version.** If the order of the coins mattered, the ways to make $3$ cents with coins of value $1$ and $2$ would be $(1,1,1)$, $(1,2)$ and $(2,1)$, giving $3$, while the unordered ways are $\{1,1,1\}$ and $\{1,2\}$, giving $2$. The unordered generating function is $\frac{1}{(1-x)(1-x^2)}$ and the ordered one is $\frac{1}{1-(x+x^2)}$, and the denominators are what tell them apart. A target of $1$ or $2$ does not expose the difference, because the two counts agree there.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
For item types of weights $w_1, \ldots, w_k$, each usable any number of
times, the number of multisets of items of total weight $n$ is the
coefficient of $x^n$ in $\prod_{i=1}^{k} (1 - x^{w_i})^{-1}$. The dynamic
program computes that coefficient list, and the dynamic program with the
outer and inner loops exchanged computes the count of ordered sequences.
</MathPanel>

<MathPanel type="proof" title="Proof">
**The encoding.** Write the factor for item type $i$ as
$\sum_{c \ge 0} x^{c w_i}$, the $c$-th term standing for the choice of using
$c$ items of that type. The product of the $k$ factors is a sum over
$k$-tuples $(c_1, \ldots, c_k)$ of nonnegative integers of the monomial
$x^{c_1 w_1 + \cdots + c_k w_k}$. The coefficient of $x^n$ collects
exactly the tuples whose weighted sum is $n$, and each such tuple is one
multiset of items, because a multiset is determined by the counts of each
type. The lemma proves the same statement in general.

**The dynamic program.** After the first $j$ types have been processed, the invariant states that `ways[t]` is the coefficient of $x^t$ in $\prod_{i=1}^{j} (1-x^{w_i})^{-1}$, reduced modulo the modulus. It holds for $j = 0$, when the product is $1$ and `ways[0] = 1` with all other entries $0$. When type $j+1$ of weight $w$ is added, the new coefficient list is the old one plus the old one shifted by $w$, because $\frac{1}{1-x^w} = 1 + \frac{x^w}{1-x^w}$. The inner loop adds exactly the shifted copy, and because it runs upward it also includes the new contribution of the same type repeatedly, which is the geometric series rather than a single use of the type. The invariant is preserved, and after all $k$ types the entry for $n$ is the required count.

**The ordered version.** When the total loop is the outer one, the state counts the sequences of total weight $t$ built from the types processed so far, and the update appends one item of the current type at the end. The coefficient list is then that of $\frac{1}{1-(x^{w_1} + \cdots + x^{w_k})}$, because the type being processed is the last one in the sequence. $\square$
</MathPanel>

## Complexity analysis

Let $n$ be the largest weight of interest and $k$ the number of item types.

| Method                                        | Time                             | Space  |
| --------------------------------------------- | -------------------------------- | ------ |
| Dynamic program, one factor at a time         | $O(nk)$                          | $O(n)$ |
| Direct convolution of two lists               | $O(n^2)$                         | $O(n)$ |
| Fast convolution, with an NTT                 | $O(n \log n)$ per multiplication | $O(n)$ |
| Linear recurrence of order $d$                | $O(nd)$                          | $O(d)$ |
| Closed form from the roots of the denominator | $O(d \log n)$ per term           | $O(d)$ |

The dynamic program is the one to write in a contest. It is $O(nk)$ where $k$ is the number of item types, which is small in every problem that uses this technique, and it needs no algebraic manipulation at all.

The space is $O(n)$ in the dynamic program, and it is $O(n)$ rather than $O(nk)$ because the coefficient list is reused for each factor. That reuse is the reason the inner loop must run upward: an upward loop reads `ways[total - coin]`, which may already include the current type, and that is the geometric series.

The fast convolution is the only way to handle the case where $k$ is large and the total weight is large, and it is a substantial amount of machinery for a contest problem. It is worth knowing that it exists.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count the ways to make $n$ with a few coin types | The dynamic program over the factors |
| Count the ways to make $n$ with a few coin types, $n$ huge | The linear recurrence from the denominator, then a matrix power |
| Count the multisets of size $k$ from $n$ types | [Stars and bars](/algorithms/combinatorics/stars-and-bars) |
| Count the subsets with a given sum | A [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack) table |
| Count the tilings of a board | The dynamic program over the tile lengths |
| Count the strings avoiding a pattern | A table over the [KMP](/algorithms/strings/kmp) automaton |
| Count the ordered sequences | The geometric series $\frac{1}{1-(x+x^2+\cdots)}$ |
| Evaluate a linear recurrence at a huge index | [Matrix exponentiation](/algorithms/number-theory/matrix-exponentiation) |

The third row is the one that saves the most time when it applies, because a multiset count is a single binomial coefficient and needs no table at all.

## Recursion decision

A generating function is an object of algebra, not of control flow, so the recursion question is really about the programs that evaluate it.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative; the coefficient list is a flat array |
| Java | About $10^4$ frames | Iterative |
| Python | The interpreter limit of 1000 | Iterative; a recursive coefficient extraction on a rational function of degree $d$ is fine only for small $d$ |
| Pascal | The operating system stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The recursive formulation that does exist is the extraction of the coefficients of $\frac{1}{Q(x)}$ one at a time, using the recurrence, and each coefficient depends on the previous $d$ of them. That is a linear recurrence, and the iterative form with a circular buffer of length $d$ is both faster and shallower than any recursive form.

The one place a recursion is natural is the naive expansion of $\frac{1}{1-x^w}$ into a coefficient list, which is a nested loop over the number of items of each type. Written as a recursion, its depth is the number of item types, which is small. Written as a loop, it is the dynamic program above.

## Implementation walkthrough

The order of the two loops is the whole algorithm.

```python
def make_change(n, coins, mod=10**9 + 7):
    ways = [0] * (n + 1)
    ways[0] = 1
    for coin in coins:
        for total in range(coin, n + 1):
            ways[total] = (ways[total] + ways[total - coin]) % mod
    return ways[n]
```

The coin loop is the outer one, so each type is multiplied into the accumulated product, and the result counts multisets. The inner loop runs upward, so the current type may be used any number of times, which is the geometric series $\frac{1}{1-x^{\text{coin}}}$. If the inner loop ran downward, the update would read an entry that has not yet been updated for the current type, and each type would be usable at most once, giving the product $\prod (1 + x^{w_i})$ instead.

The base case `ways[0] = 1` is the empty multiset, and it is the coefficient of $x^0$ in the product of empty factors, which is $1$. A program that leaves it at zero reports that nothing can be made, which is the classic symptom.

The reduction is applied to the sum, and the operands are already reduced, so the intermediate value is less than $2m$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| The inner loop runs downward | Each item type is usable at most once | Run the inner loop upward |
| The coin loop is the inner one | The order of the items is counted | Put the type loop outside |
| `ways[0]` is left at zero | Every count is zero | Initialize the empty configuration to one |
| Using $\frac{1}{1-x}$ for a bounded supply | The count is too large | Use $\frac{1-x^{c+1}}{1-x}$ for at most $c$ items |
| Evaluating the series at a number instead of extracting a coefficient | The answer is meaningless, and usually infinite | Extract the coefficient |
| Adding the factors instead of multiplying them | The count is the sum of the counts, not the convolution | Multiply |
| Confusing the ordered and the unordered series | The count is off by a factor that grows with $n$ | Check whether the order of the choices matters |

### Why this fails: the product that forgets the order

The plausible wrong approach is to use the same product for every problem about choices, because the product is so much easier to reason about. The trouble is that the product counts a **multiset** of choices, one from each factor, and a problem that cares about the order of the choices needs a different series.

The smallest counterexample uses coins of value $1$ and $2$ and a target of $3$. The multiset ways to make $3$ are $\{1,1,1\}$ and $\{1,2\}$, so there are $2$ of them. The ordered ways are $(1,1,1)$, $(1,2)$ and $(2,1)$, so there are $3$.

The generating functions for the two are

$$
\frac{1}{(1-x)(1-x^2)} \quad \text{versus} \quad \frac{1}{1-(x+x^2)},
$$

and their coefficient lists differ starting at $x^3$: the first has coefficient $2$ there and the second has coefficient $3$. The first series is the product of two geometric series, one per denomination, and the second is a single geometric series whose numerator is the sum of the denominations, and the sum inside the series is exactly the statement that the last coin may be any one of the two.

A target of $1$ and a target of $2$ do not expose the difference: at $1$ the multiset count and the ordered count are both $1$, and at $2$ they are both $2$, from $\{1,1\}$ and $\{2\}$. Three is the smallest target at which the order of the choices is visible at all, and it is the smallest counterexample there is.

The lesson generalizes: **a product counts independent choices with no order between them, and a sum inside a geometric series counts a sequence whose order is part of the object.** The same distinction separates the multiset coefficient $\binom{n+k-1}{k}$ from the falling factorial $n(n-1)\cdots(n-k+1)$, and it is the reason the statement has to say whether the order matters.

## Variants and extensions

- **A bounded supply.** A type usable at most $c$ times contributes $\frac{1-x^{(c+1)w}}{1-x^w}$ instead of $\frac{1}{1-x^w}$, and the numerator is what removes the excess.
- **A rational function and a recurrence.** If $F(x) = P(x)/Q(x)$ with $Q(0) = 1$, then the coefficients of $F$ satisfy the linear recurrence given by the coefficients of $Q$, and the closed form is a sum of $r^n$ times a polynomial, where the $r$ are the roots of $Q$.
- **The logarithmic derivative.** From $F'(x)/F(x)$ one reads off the number of configurations weighted by the number of items, which is a standard way to count the configurations of each size.
- **Multivariate series.** Weighting each item type with its own variable counts the configurations by their type counts, and the coefficient of $x_1^{a_1} \cdots x_k^{a_k}$ is the number of configurations with those counts.
- **Formal versus analytic.** Everything in this article is an identity of formal series and holds in any ring, including the residues modulo a prime. Nothing requires convergence, and a series with a factor $\frac{1}{1-x}$ is perfectly well defined even though it does not converge for $|x| \ge 1$.
- **The generating function of a binomial coefficient.** From the binomial theorem, the generating function of $\binom{n}{k}$ over $n$ for fixed $k$ is $\frac{x^k}{(1-x)^{k+1}}$.
- **A determinant.** The generating function of the paths in a directed acyclic graph is the inverse of a determinant, which is the "transfer matrix" method in a different notation.

## Contest strategy

1. Write down the weight of each item type and the target. If the items do not have an additive weight, the generating function does not apply.
2. Decide whether the order of the choices matters. The answer decides between the product of the factors and the single geometric series.
3. Write the factor for each type: $\frac{1}{1-x^{w}}$ for an unlimited supply, $\frac{1-x^{(c+1)w}}{1-x^w}$ for at most $c$, and $1+x^w$ for at most one.
4. Implement the dynamic program rather than the algebra. The product is the reasoning, and the program never needs to be written as a series.
5. Check the base case: the count of the empty configuration is $1$.
6. Compare against the brute force on small targets. The brute force enumerates the multisets directly, and a disagreement is either a wrong factor or a wrong loop order.
7. When the target is enormous, do not compute the series. Find the denominator, read off the recurrence, and use [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).

## Worked problems

### Problem 1: making change

**Restatement.** With coins of value $1$, $3$ and $4$, how many ways are there to make $n$ cents, for $n \le 10^6$? The answer is wanted modulo $10^9 + 7$.

**Naive baseline.** Enumerate the multisets, which is the same count and is exponential in $n$.

**Insight.** Each denomination contributes a geometric series, and the answer is the coefficient of $x^n$ in their product.

**Derivation.** The generating function is $\frac{1}{(1-x)(1-x^3)(1-x^4)}$, and the coefficient list is computed by the dynamic program: initialize `ways[0] = 1`, and for each coin $c$ add `ways[t - c]` into `ways[t]` for $t$ from $c$ to $n$, upward.

**Correctness.** The theorem above proves that the entry for $n$ is the number of multisets of coins summing to $n$.

**Complexity.** $O(3n)$ time and $O(n)$ space.

**Common wrong approach.** Running the inner loop downward, which makes each denomination usable at most once and returns the coefficient list of $(1+x)(1+x^3)(1+x^4)$.

### Problem 2: solutions of a linear equation

**Restatement.** How many nonnegative integer solutions does $x + 2y + 3z = n$ have, for $n \le 10^6$?

**Naive baseline.** A double loop over $x$ and $y$ with $z$ forced, which is $O(n^2)$ and is too slow at $n = 10^6$.

**Insight.** The three variables are three item types with weights $1$, $2$ and $3$, and a solution is a multiset of them with total weight $n$.

**Derivation.** The generating function is $\frac{1}{(1-x)(1-x^2)(1-x^3)}$, and the coefficient list is computed by the dynamic program over the three factors.

**Correctness.** The encoding in the theorem is a bijection between the solutions and the multisets, because a solution is determined by the triple $(x, y, z)$, which is the count of each type.

**Complexity.** $O(3n)$ time and $O(n)$ space, against $O(n^2)$ for the double loop.

**Common wrong approach.** Using a geometric series for the variable with weight $1$ and forgetting the others, which counts the solutions of $x = n$ alone.

### Problem 3: tilings of a board

**Restatement.** A board of $n$ cells is tiled with tiles of lengths $1$, $2$ and $3$. How many tilings are there, modulo $10^9+7$, for $n \le 10^{18}$?

**Naive baseline.** The dynamic program over the board, which is $O(n)$ and is too slow when $n$ is that large.

**Insight.** The generating function is $\frac{1}{1-x-x^2-x^3}$, so the counts satisfy a recurrence of order $3$, and a recurrence can be evaluated at a huge index with a matrix power.

**Derivation.** A tiling is an ordered sequence of tiles, so the encoding is the ordered one: each tile contributes a weight, and the sequence is a choice repeated until the total is reached. The generating function is $\frac{1}{1-(x+x^2+x^3)} = \frac{1}{1-x-x^2-x^3}$, so comparing coefficients gives the recurrence $f(n) = f(n-1) + f(n-2) + f(n-3)$ with $f(0) = 1$, $f(1) = 1$, $f(2) = 2$, and $f(n) = 0$ for $n < 0$.

Note that the product $\frac{1}{(1-x)(1-x^2)(1-x^3)}$ is the generating function of the multisets of tiles, not of the tilings, and it is a different sequence. A board of $3$ cells has $3$ tilings with tiles of length $1$, $2$ and $3$, namely $1+1+1$, $1+2$ and $2+1$, but only $2$ multisets, namely $\{1,1,1\}$ and $\{1,2\}$.

**Correctness.** The tiling of the first tile gives the partition of the tilings by the length of the first tile, which is the recurrence. The matrix power evaluates the recurrence exactly.

**Complexity.** $O(3^3 \log n)$ time and $O(3^2)$ space for the matrix power, against $O(n)$ for the linear dynamic program.

**Common wrong approach.** Using the recurrence with the wrong base cases, in particular $f(0) = 0$, which reports that the empty board has no tilings and then reports zero for every count.

## Practice progression

1. **Recognition.** Given a statement, decide whether the items have an additive weight, whether the order of the choices matters, and whether each type has a bound.
2. **Direct application.** Implement the dynamic program for the factors, and check it against a brute force enumeration of the multisets for every target up to $30$.
3. **Adaptation.** Add a bound on one type, count the ordered versions, and extract the recurrence from the denominator of a small example.
4. **Combination.** Combine a generating function with the modular arithmetic that keeps the coefficients exact, and with the [binomial theorem](/algorithms/combinatorics/binomial-coefficients) that gives the coefficients of $(1+x)^n$.
5. **Challenge.** Solve a problem with $n \le 10^{18}$ by finding the recurrence from the denominator and evaluating it with a matrix power, and check the two answers for $n \le 1000$.
6. **Transfer.** Recognize the technique in another subject: the number of lattice paths, the number of ways to place identical items into boxes, the number of subsets with a given sum, or the number of tilings. Where the count is a single binomial coefficient, use [stars and bars](/algorithms/combinatorics/stars-and-bars) instead.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Define a formal power series and state how two of them are multiplied. (Formal model)
2. State the coefficient interpretation of a generating function, and prove it for two families of configurations. (Formal model)
3. Give the geometric series and say what it encodes. (Key insight)
4. State the binomial theorem and say which counting argument it encodes. (Key insight)
5. Give the generating function of the ways to make $n$ with coins of value $1$, $3$ and $4$, and explain each factor. (Algorithm derivation)
6. How does the dynamic program compute the coefficient list, and why must the inner loop run upward? (Implementation walkthrough)
7. How does a bounded supply change the factor? (Variants and extensions)
8. What does the degree of the denominator of a rational generating function tell you? (Algorithm selection)
9. Give the smallest counterexample to using the product for an ordered count. (Common mistakes)
10. Why is a formal power series usable modulo a prime? (Variants and extensions)
11. What are the time and space of the dynamic program, and how do they compare with the direct convolution? (Complexity analysis)
12. When is a single binomial coefficient a better answer than a series? (Algorithm selection)

## Further reading

- The binomial theorem's coefficient, and the counting argument that proves it, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The coefficient list that the dynamic program computes, and the recurrence that it satisfies, are in [counting dynamic programming](/algorithms/combinatorics/counting-dp).
- The arithmetic that keeps the coefficients exact under a modulus is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The matrix power that evaluates the recurrence at a huge index is in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- The multiset count that some of these series reduce to, when the weights are all equal, is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The convolution that the product of two series computes is the same arithmetic as the prefix sum, applied to a table rather than to a sequence. (Algorithm selection)
- The discrete mathematics of formal series, roots and the algebra behind the identities is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index lists this technique, [generating functions](/algorithms/combinatorics/generating-functions), beside the counting arguments it does not yet cover: [the combinatorics](/algorithms/combinatorics/).
