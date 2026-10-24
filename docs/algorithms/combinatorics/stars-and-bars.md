---
id: combinatorics.stars-and-bars
title: Stars and bars
summary: Count the ways to place n identical items into k distinct boxes with one binomial coefficient, and prove the count with a bijection to a row of stars separated by bars.
division: [silver, gold]
subjects: [combinatorics]
level: intermediate
importance: common-contest-technique
keywords:
    [
        stars and bars,
        distributions,
        weak composition,
        nonnegative integer solutions,
        binomial coefficient,
        combinations with repetition,
        indistinguishable items,
    ]
prerequisites:
    required: [combinatorics.binomial-coefficients]
    recommended: [foundations.complexity, foundations.recursion]
complexity:
    time: "O(min(k-1, n))"
    space: "O(1)"
assumptions:
    - The items are identical, so that a distribution is determined only by the number of items in each box.
    - The boxes are distinct, so that a distribution is an ordered tuple of counts.
reviewed: false
---

## At a glance

The question "how many ways can $n$ identical candies be given to $k$ children" has an answer that is a single binomial coefficient, and the argument that produces it is a picture: write $n$ stars in a row, and place $k-1$ bars among them.

| Property            | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| **Problem**         | Count the ways to place $n$ identical items into $k$ distinct boxes     |
| **Weak form**       | $\binom{n+k-1}{k-1}$                                                    |
| **Strong form**     | $\binom{n-1}{k-1}$                                                      |
| **Time**            | $O(\min(k-1, n))$ with the multiplicative formula                       |
| **Auxiliary space** | $O(1)$                                                                  |
| **Requires**        | Identical items, distinct boxes                                         |
| **Fails when**      | The items are distinguishable, in which case the count is a multinomial |

The weak form allows empty boxes and the strong form forbids them, and the difference between them is a single shift of every count by one. Everything else in the subject is either that shift, a bound on individual boxes, or the decision of whether the items can be told apart.

## Problem motivation

A bakery has $n = 12$ muffins, all of them identical, and three children. Each child must receive at least one muffin, and the order in which the muffins are handed out does not matter. How many distributions are there?

The naive baseline enumerates. A recursive function that hands one muffin at a time to one of three children, refusing to leave a child empty at the end, produces every answer, and the number of answers is $\binom{11}{2} = 55$. For $n = 12$ that is nothing at all. But the same question with $n = 10^6$ has $\binom{10^6+2}{2}$ answers, about $5 \times 10^{11}$ of them, and no contest has time to enumerate them.

The insight is that the answer has a formula, and the formula is $O(\min(k-1,n))$ arithmetic steps regardless of how large the answer is. The reason is that we do not count the distributions one at a time. We count the _shapes_ that a distribution can have, and there is only one shape for every multiset of counts, because the muffins are identical.

Now make the muffins distinguishable, with $n$ different kinds of muffin, and the same question has $k^n$ answers instead, because each muffin independently chooses a child. That is the whole difference between this article and the multinomial count, and a statement that says "identical", "the same", "indistinguishable", or "of $n$ identical candies" is the signal that selects this technique.

## Recognition patterns

Stars and bars is the right tool when the statement contains some of these phrases.

- "In how many ways can $n$ identical objects be distributed among $k$ boxes."
- "How many nonnegative integer solutions does $x_1 + x_2 + \cdots + x_k = n$ have?"
- "How many ways to split $n$ into a sum of $k$ nonnegative parts?"
- "How many ways to write $n$ as an ordered sum of $k$ terms?"
- "Each child receives at least one", "no box is empty", "every group is nonempty".

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| The items are identical and the boxes are distinct | Stars and bars applies |
| The items are distinguishable | The count is a multinomial, and stars and bars is wrong by a factor of $n!$ divided by the factorials of the equal groups |
| The boxes are identical | The count is a partition, which is a different and harder problem |
| $n \le 20$ | Enumeration is affordable, and is the reference implementation |
| $n \le 10^9$ and the answer is wanted exactly | The multiplicative formula still works when $k$ is small |
| $n \le 10^9$ and the answer is wanted modulo a prime | The modular product in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients) applies |
| Every box has an upper bound as well | Stars and bars alone is not enough; [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) is needed |
| $k$ is large and $n$ is large | The answer has hundreds of digits, and only a modular answer is representable |

The second row is the one that produces a wrong answer rather than a crash. A program that assumes indistinguishability when the items are labeled reports a number that is too small by a factor that depends on the distribution, and the factor is different for each distribution, so no single patch fixes it.

## Naive approach

The baseline enumerates the distributions recursively. Choose the count for the first box, then the second, and the last is forced.

```python
def distributions(n, k):
    if k == 1:
        return [(n,)] if n >= 0 else []
    result = []
    for first in range(n + 1):
        for rest in distributions(n - first, k - 1):
            result.append((first,) + rest)
    return result
```

This is correct, it returns exactly the weak compositions of $n$ into $k$ parts, and it costs $\binom{n+k-1}{k-1}$ results, which is exactly the number the problem asks for. It is the right answer for small inputs and the reference implementation for the differential test.

The second baseline is the one most people write first, and it is wrong in a way worth naming: it treats the answer as the number of ways to choose which boxes are nonempty.

```python
from math import comb

def wrong(n, k):
    return comb(n, k)   # chooses the nonempty boxes
```

This counts a _different_ object. It says that each nonempty box receives exactly one group, without saying how many items are in each group, so it silently assumes each nonempty box holds exactly one item.

## Key insight

The insight is that **a distribution of $n$ identical items into $k$ distinct boxes is in bijection with a way of writing $n$ stars in a row and cutting the row into $k$ pieces with $k-1$ bars.**

Write the $n$ stars. Now slide the $k-1$ bars into the $n+1$ gaps between and around them, with several bars allowed in the same gap. The number of stars before the first bar is the number of items in box one, the number between the first and second bar is the number in box two, and so on.

Two facts make this an exact correspondence rather than a suggestive picture.

1. **Every distribution gives exactly one string.** A distribution is the tuple $(x_1, \ldots, x_k)$ of counts, and the string is $x_1$ stars, a bar, $x_2$ stars, a bar, and so on. There is nothing to choose and nothing to order, because the boxes are distinct and appear in a fixed order.
2. **Every string gives exactly one distribution.** Read the counts of stars in the $k$ consecutive groups. The groups are separated by the bars, and a group may be empty, which is exactly what "a box may be empty" means.

So the number of distributions is the number of strings, and the strings are counted by choosing bar positions. A string of $n$ stars and $k-1$ bars occupies $n+k-1$ positions, and the $k-1$ bar positions are chosen from them. The count is therefore $\binom{n+k-1}{k-1}$.

The strong form follows by the same picture. If every box must be nonempty, then no two bars may sit in the same gap, because an empty group is exactly two adjacent bars. Put one star in each group first, which uses up $k$ of the $n$ stars, and the remaining $n-k$ stars are distributed freely, giving $\binom{n-k+k-1}{k-1} = \binom{n-1}{k-1}$.

## Formal model

Let $n$ be a nonnegative integer and $k$ a positive integer.

::: math definition Definition
A **weak composition** of $n$ into $k$ parts is a tuple
$(x_1, x_2, \ldots, x_k)$ of nonnegative integers with
$x_1 + x_2 + \cdots + x_k = n$. A **strong composition** of $n$ into $k$
parts is a tuple of positive integers with the same sum. The number of
weak compositions is written $W(n,k)$ and the number of strong compositions
is written $S(n,k)$.
:::


::: math definition Definition
A **$k$-element multiset** drawn from a set of $m$ types is a collection in
which each type may appear any number of times, and two collections are equal
when they contain the same number of copies of each type. The number of
such multisets is the number of ways to choose $k$ positions in a row of
$m+k-1$ positions, so it is $\binom{m+k-1}{k}$.
:::


::: math lemma Lemma
For all $n \ge 0$ and $k \ge 1$,
$$
W(n,k) = \binom{n+k-1}{k-1},
$$
and for all $n \ge k \ge 1$,
$$
S(n,k) = \binom{n-1}{k-1}.
$$
:::


::: math proof Proof
The map from a weak composition to a string sends
$(x_1, \ldots, x_k)$ to $x_1$ stars, a bar, $x_2$ stars, a bar, and so on,
ending with $x_k$ stars. The string contains $n$ stars in total and $k-1$
bars, and it is of length $n+k-1$. The map is injective, because the counts
of stars in the $k$ groups recover the tuple, and it is surjective, because
any string with $n$ stars and $k-1$ bars splits into $k$ groups whose star
counts are nonnegative and sum to $n$. Hence $W(n,k)$ equals the number of
strings with $n$ stars and $k-1$ bars, which is the number of ways to choose
the $k-1$ bar positions among $n+k-1$ positions, namely
$\binom{n+k-1}{k-1}$.

For the strong count, the map from a strong composition to a string never places two bars in the same gap, so it lands among the strings in which each group is nonempty. Deleting one star from the first group of each such string gives a string with $n-k$ stars and $k-1$ bars in which the groups may be empty, and this map is again a bijection. Therefore $S(n,k) = W(n-k, k) = \binom{n-k+k-1}{k-1} = \binom{n-1}{k-1}$. $\square$
:::


::: math invariant Invariant
During the multiplicative evaluation of $\binom{n+k-1}{k-1}$, after the $j$-th
step the running product equals
$$
\frac{\prod_{i=0}^{j-1} (N - i)}{\prod_{i=1}^{j} i},
\qquad N = n+k-1,
$$
which is the exact value of $\binom{N}{j}$ as a rational number. The loop
stops at $j = k-1$, where the invariant says the running product is the
answer.
:::


## Algorithm derivation

The counting argument gives the answer; the algorithm is the arithmetic that evaluates it. Put $N = n+k-1$ and $r = k-1$. The multiplicative formula for the binomial coefficient is

$$
\binom{N}{r} = \frac{N(N-1)\cdots(N-r+1)}{r!}.
$$

The numerator is accumulated in a loop of $r$ steps, the denominator in another loop of $r$ steps, and the answer is the numerator divided by the denominator.

Two refinements matter in contests. The first is to replace $r$ by $\min(r, N-r)$, because $\binom{N}{r} = \binom{N}{N-r}$ and one of the two is always at most half of $N$. The second is to reduce modulo a prime $p$ after every multiplication and to divide by the inverse of the denominator, so that the intermediate values never exceed $p^2$. That version is the [modular product](/algorithms/combinatorics/binomial-coefficients), and it is the one that a statement asking for the answer modulo $10^9+7$ needs.

The counting interpretation also has an iterative form that produces the distributions themselves when they are few enough to list. Write the count for the first box as $x_1 \in 0..n$, then the count for the second box as $x_2 \in 0..n-x_1$, and so on, with the last count forced to be $n - x_1 - \cdots - x_{k-1}$. The invariant of that enumeration is that the remaining amount to distribute equals the sum of the remaining capacities.

## Step-by-step execution

Take $n = 5$ identical items and $k = 3$ distinct boxes. The weak count is $\binom{7}{2} = 21$.

The string has five stars and two bars, so it has seven positions. Choosing two of them for the bars gives the strings and the distributions:

| String           | Reading                   | Distribution |
| ---------------- | ------------------------- | ------------ |
| `\|\*\*\*\*\*`   | 0 stars, 0 stars, 5 stars | $(0, 0, 5)$  |
| `\*\|\*\*\*\*`   | 1 star, 0 stars, 4 stars  | $(1, 0, 4)$  |
| `\*\*\|\|\*\*\*` | 2 stars, 0 stars, 3 stars | $(2, 0, 3)$  |
| `\*\*\|\*\|\*\*` | 2 stars, 1 star, 2 stars  | $(2, 1, 2)$  |
| `\*\*\*\|\*\|\*` | 3 stars, 1 star, 1 star   | $(3, 1, 1)$  |
| `\*\*\*\*\*\|\|` | 5 stars, 0 stars, 0 stars | $(5, 0, 0)$  |

Only six of the twenty-one rows are shown, and they are not in the order a naive enumeration produces, because the string picture orders by bar position rather than by the value of $x_1$.

The strong count for the same $n$ and $k$ is $\binom{4}{2} = 6$, and the six distributions are $(1,1,3)$, $(1,2,2)$, $(1,3,1)$, $(2,1,2)$, $(2,2,1)$ and $(3,1,1)$. Notice that the strong count is the weak count with $n$ replaced by $n-k = 2$, which is $\binom{2+2}{2} = 6$.

## Correctness proof

::: math theorem Theorem
The stars and bars count of the weak compositions of $n$ into $k$ parts is
$\binom{n+k-1}{k-1}$, the count of the strong compositions is
$\binom{n-1}{k-1}$, and the multiplicative evaluation returns the exact
value of that binomial coefficient.
:::


::: math proof Proof
The bijection of the lemma gives the two counts: every weak composition
corresponds to exactly one string of $n$ stars and $k-1$ bars, and the
strings are counted by choosing the bar positions among the $n+k-1$
positions, which is $\binom{n+k-1}{k-1}$. The strong compositions correspond
to the strings in which no group is empty, and deleting one star from each
group is a bijection between those strings and the weak compositions of
$n-k$ into $k$ parts, which is $\binom{n-1}{k-1}$.

Now the evaluation. Let $N = n+k-1$ and $r = k-1$. The loop maintains the invariant that after step $j$ the running numerator is $\prod_{i=0}^{j-1}(N-i)$ and the running denominator is $j!$. The initialization holds with empty products. Each step multiplies the numerator by $N-j+1$ and the denominator by $j$, so the invariant is preserved. At termination $j = r$, the ratio is $N(N-1)\cdots(N-r+1) \,/\, r!$, which is $\binom{N}{r}$ by the definition of the binomial coefficient as the number of $r$-element subsets of an $N$-element set.

Finally, the division is exact. The numerator and the denominator are both integers and the ratio is the integer $\binom{N}{r}$, so no information is lost. When the answer is required modulo a prime $p$ with $r < p$, the denominator $r!$ is not divisible by $p$ and therefore has an inverse modulo $p$, and the same computation in the residues returns the residue of the exact count. $\square$
:::


## Complexity analysis

The evaluation of $\binom{N}{r}$ with the multiplicative formula performs $2r$ multiplications and one division, where $r = \min(k-1, n)$ after the symmetry is applied.

- **Time:** $O(\min(k-1, n))$ arithmetic operations. With a modular answer there is an extra $O(\log p)$ for the inverse of the denominator.
- **Auxiliary space:** $O(1)$.
- **Enumeration, for comparison:** $\binom{n+k-1}{k-1}$ results, each of length $k$, so $O\!\left(k\binom{n+k-1}{k-1}\right)$ time and space.

The gap between the two is the reason the formula exists. With $n = 10^6$ and $k = 3$, the formula takes about two steps and the enumeration takes about $5 \times 10^{11}$.

The size of the exact answer is worth naming, because it decides whether the exact computation is even representable. The answer is $\binom{n+k-1}{k-1}$, which for $k$ fixed grows like $n^{k-1}$, so for $k = 20$ and $n = 10^9$ the answer has more than $10^{155}$ in it and no machine word holds it. A statement that does not mention a modulus is asking for an exact answer, and the exact answer must then be small enough to be stored.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Identical items, distinct boxes, empty allowed | Stars and bars, weak form |
| Identical items, distinct boxes, none empty | Stars and bars, strong form |
| Identical items, distinct boxes, upper bound on each | Stars and bars plus [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) |
| Identical items, identical boxes | Integer partition, which is a different problem |
| Distinct items, distinct boxes | Multinomial, $\frac{n!}{a_1! a_2! \cdots a_k!}$ |
| Distinct items, identical boxes | A factorial divided by factorials of the multiplicities |
| A sum with a fixed number of positive parts | Stars and bars, strong form |
| A count expressed as a coefficient of a product | [Generating functions](/algorithms/combinatorics/generating-functions) |

The fourth row is the trap. "Distribute $n$ identical candies among $k$ identical children" is a partition of $n$ into at most $k$ parts, which has no closed formula, and stars and bars overcounts it by the number of permutations of the parts.

## Recursion decision

The stars and bars count itself is arithmetic and needs no recursion at all. The recursive program that enumerates the distributions is a different matter, and its depth is $k$, one frame per box.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative for any $k$ above a few thousand |
| Java | About $10^4$ frames | Iterative for any $k$ above a few thousand |
| Python | The interpreter limit of 1000 | Iterative, and rewrite the recursion as a nested loop over the box counts |
| Pascal | The operating system stack | Iterative for any $k$ above a few thousand |
| JavaScript | About $10^4$ frames | Iterative for any $k$ above a few thousand |

The recursion is also the wrong shape even where it fits. The recursive enumerator rebuilds the list of suffixes at every level, so it allocates the same suffix lists over and over, and the cost is not merely the depth but the number of results.

The one place where a recursive formulation is genuinely better is the multiplicative evaluation of the binomial coefficient, and even there the iterative form is preferred, because the recursive form multiplies the call count by the number of terms.

## Implementation walkthrough

Two lines decide whether the answer is right, and both are about which formula is used.

```python
from math import comb

def weak(n, k):
    return comb(n + k - 1, k - 1)

def strong(n, k):
    return comb(n - 1, k - 1) if n >= k else 0
```

The `n + k - 1` in the weak form and the `n - 1` in the strong form are not interchangeable, and the difference between them is exactly the $k-1$ that the strong form has already removed.

The second line that matters is the guard in `strong`. When $n < k$ there is no way to give every box at least one item, the answer is zero, and a computation of $\binom{n-1}{k-1}$ with $n-1 < k-1$ either raises or returns nonsense. The guard is not defensive programming; it is the $S(n,k) = 0$ case of the definition.

The third is the reduction of the range. When $k$ is large and $n$ is small, $\binom{n+k-1}{k-1} = \binom{n+k-1}{n}$, and computing it as the $n$-term product rather than the $k$-term product changes the running time from $O(k)$ to $O(n)$.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Using $\binom{n}{k}$ | The count is the number of nonempty boxes, not the number of distributions | Use $\binom{n+k-1}{k-1}$ |
| Using the weak form when boxes must be nonempty | The answer is too large | Subtract one per box first, then use the strong form |
| Treating the items as distinguishable | The answer is too large by an unbounded factor | Read the statement for "identical" |
| Treating the boxes as identical | The answer is too large, by the number of permutations of the parts | Check that the boxes are named or ordered |
| Computing $\binom{n-1}{k-1}$ when $n < k$ | A crash or a garbage value | Guard with $n \ge k$ |
| Reducing modulo a composite number and dividing | The inverse does not exist | Use a prime modulus, or factor the modulus |
| Forgetting that the answer may not fit | The program prints a truncated or wrapped number | Check the digit count of the answer before promising an exact result |

### Why this fails: counting the nonempty boxes instead of the distributions

The plausible wrong approach is to observe that a distribution of $n$ identical items into $k$ boxes is determined by which boxes are nonempty, together with how many items each nonempty box holds, and then to count only the first part. That is $\binom{n}{k}$, and it is the count of the subsets of size $k$ of an $n$-element set.

The smallest counterexample is $n = 3$ identical items and $k = 2$ distinct boxes. The wrong formula gives $\binom{3}{2} = 3$. The correct answer is $4$, because the distributions are $(3,0)$, $(2,1)$, $(1,2)$ and $(0,3)$.

Three and two is the smallest input that exposes the bug. With $n = 2$ and $k = 2$ the wrong formula gives $\binom{2}{2} = 1$ and the correct answer is $2$, namely $(2,0)$ and $(1,1)$, so the bug appears there too, but the case $n = 3, k = 2$ is the one worth remembering because it has an even answer and an odd wrong answer, which makes the discrepancy obvious in a differential test.

The second failure in the same area is the offset between the two forms. A program that counts the weak compositions when the statement requires every box to be nonempty overcounts by the number of distributions with at least one empty box. The smallest counterexample is $n = 2$, $k = 2$ with every box required to be nonempty: the weak formula gives $\binom{3}{1} = 3$, while the only valid distribution is $(1,1)$, so the answer is $1$.

The lesson generalizes: **a count is the number of objects being counted, and the objects here are the tuples of counts, not the subsets of the boxes that happen to be used.** The same distinction separates the weak form from the strong form, and it separates stars and bars from the partition count.

## Variants and extensions

- **Upper bounds on each box.** When every box holds at most $c$ items, the count is $\sum_{j=0}^{k} (-1)^j \binom{k}{j}\binom{n - j(c+1) + k - 1}{k-1}$, which is [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion) applied to the weak compositions.
- **Exactly $j$ nonempty boxes.** $\binom{k}{j}$ times the strong count of $n$ into $j$ parts.
- **Nonnegative solutions to $a_1x_1 + \cdots + a_kx_k = n$.** The generating function is $\prod_i (1 - x^{a_i})^{-1}$ and the answer is a coefficient of it, which is [generating functions](/algorithms/combinatorics/generating-functions).
- **Ordered versus unordered parts.** The weak composition counts ordered tuples. A partition of $n$ counts unordered ones, and there is no formula for a partition.
- **Combinations with repetition.** Choosing $k$ items from $n$ types with repetition allowed is $\binom{n+k-1}{k}$, which is the same formula with $n$ and $k$ swapped.
- **Bars with no two adjacent.** A related count is $\binom{n+1}{k}$, the count of strings with $n$ stars and $k$ bars in which no two bars touch.

## Contest strategy

1. Decide whether the items are identical before anything else. If they are not, this article does not apply and a multinomial does.
2. Decide whether the boxes are distinct. If they are not, the problem is a partition and the formula does not exist.
3. Decide whether empty boxes are allowed. This one word changes the formula from $\binom{n+k-1}{k-1}$ to $\binom{n-1}{k-1}$.
4. Write the formula before writing the code, and write it in the form $\binom{n+k-1}{k-1}$ rather than in words.
5. Check the guard case $n < k$ for the strong form.
6. Check whether the answer fits. If the statement gives no modulus, the answer is exact, and the number of digits is roughly $(k-1)\log_{10} n$.
7. When the answer is wanted modulo a prime, use the modular product and the modular inverse rather than the exact division, and see [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Worked problems

### Problem 1: the muffin distribution

**Restatement.** Twelve identical muffins are divided among three children so that each child receives at least one muffin. How many distributions are there?

**Naive baseline.** Recursive enumeration over the count of the first child, the count of the second, and the third forced, which produces $\binom{11}{2} = 55$ results.

**Insight.** The children are distinct and the muffins are identical, so the answer is the strong count $\binom{n-1}{k-1}$ with $n = 12$ and $k = 3$.

**Derivation.** Give each child one muffin, leaving $12-3 = 9$ muffins to distribute freely among three children. The weak count for $9$ and $3$ is $\binom{11}{2} = 55$.

**Correctness.** The bijection in the lemma maps each strong composition to a string of twelve stars and two bars with no empty group, and deleting one star per group gives a string of nine stars and two bars with empty groups allowed. The two sets of strings are in bijection, so the counts agree.

**Complexity.** $O(\min(k-1, n)) = O(2)$ arithmetic operations and $O(1)$ space.

**Common wrong approach.** Using the weak count $\binom{14}{2} = 91$, which counts the distributions in which a child may receive nothing.

### Problem 2: solutions of a linear equation

**Restatement.** How many triples of nonnegative integers $(x, y, z)$ satisfy $x + y + z = 100$?

**Naive baseline.** A loop over $x$ from $0$ to $100$ and over $y$ from $0$ to $100-x$, which is about $5 \times 10^3$ pairs. It happens to be fast because $n$ is small, and it is the reference implementation.

**Insight.** The equation is exactly the definition of a weak composition of $100$ into $3$ parts.

**Derivation.** The answer is $\binom{102}{2} = 5151$.

**Correctness.** Each triple of nonnegative integers summing to $100$ is a weak composition, and the lemma counts those.

**Complexity.** $O(2)$ arithmetic operations, or $O(n^2)$ by enumeration.

**Common wrong approach.** Treating the equation as a set of $100$ identical items and $3$ identical boxes, which is a partition and not a composition.

### Problem 3: ballots with a cap on each box

**Restatement.** A factory ships $30$ identical widgets among $5$ trucks. Each truck carries at most $8$ widgets, and a truck may carry none. How many shipments are there?

**Naive baseline.** A dynamic program over the trucks, tracking the running total, which is $O(5 \times 30 \times 9)$ and perfectly adequate. It is the right answer when the cap is small, and the reference implementation for the formula.

**Insight.** The count is the weak count $\binom{34}{4}$ minus the distributions in which some truck carries at least $9$ widgets, and the second part is counted by inclusion and exclusion over the five trucks.

**Derivation.** Without the cap the count is $\binom{34}{4} = 46376$. For a fixed truck that violates the cap, remove $9$ widgets from it, which gives $\binom{25}{4}$. For two trucks that both violate it, remove $9$ from each, giving $\binom{16}{4}$, and so on. The answer is $\binom{34}{4} - 5\binom{25}{4} + \binom{5}{2}\binom{16}{4} - \binom{5}{3}\binom{7}{4}$, where the last term is zero because $30 - 27 = 3 < 4$.

**Correctness.** A distribution violates the cap exactly when some subset of trucks each carry at least $9$ widgets, and the terms of the sum count the distributions weighted by the number of violating subsets they contain, which is zero for every valid distribution and cancels for every invalid one. The argument is spelled out in [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).

**Complexity.** $O(5 \cdot 4)$ arithmetic operations, so $O(k \cdot \min(k, n))$ in general, and $O(1)$ space.

**Common wrong approach.** Reporting $\binom{34}{4}$ and ignoring the cap, which is an overcount of $22155$.

## Practice progression

1. **Recognition.** Given a statement, decide whether the items are identical, whether the boxes are distinct, and whether empty boxes are allowed. Write down $n$ and $k$.
2. **Direct application.** Implement the weak count, the strong count, and the enumeration of all distributions, and check the first two against the third for every $n \le 8$ and $k \le 3$.
3. **Adaptation.** Add an upper bound on each box using inclusion and exclusion, and add the count of distributions with exactly $j$ nonempty boxes.
4. **Combination.** Combine stars and bars with [binomial coefficients](/algorithms/combinatorics/binomial-coefficients) to evaluate the answer modulo a prime, and with [modular arithmetic](/algorithms/number-theory/modular-arithmetic) to justify the division.
5. **Challenge.** Solve a problem where the objects are the rows of a matrix, the columns are the boxes, and the answer is a coefficient of a product rather than a single binomial coefficient.
6. **Transfer.** Recognize the count in another subject: the number of ways to place balls into bins with a cap, the number of monomials of a given degree, or the number of solutions of a knapsack equation, whose generating function is in [generating functions](/algorithms/combinatorics/generating-functions).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the weak form and the strong form of the count, and say what changes between them. (At a glance)
2. Describe the bijection between a weak composition and a string of stars and bars in both directions. (Key insight)
3. Prove that the strong compositions of $n$ into $k$ parts are counted by $\binom{n-1}{k-1}$. (Formal model)
4. What invariant does the multiplicative evaluation maintain, and what does it say at termination? (Formal model)
5. Trace the string picture for $n = 5$, $k = 3$ and give the distribution for `**|*|**`. (Step-by-step execution)
6. Why is the enumeration exponential while the formula is not, and what are the two costs? (Complexity analysis)
7. Give the smallest input on which $\binom{n}{k}$ is the wrong answer, and say what the right answer is. (Common mistakes)
8. When do the boxes being identical make the problem a different one? (Algorithm selection)
9. What is the depth of the recursive enumeration, and why is it the wrong shape even where it fits? (Recursion decision)
10. How is the count of distributions with a cap on each box obtained from the weak count? (Variants and extensions)

## Further reading

- The binomial coefficient that the answer is, and the modular product that evaluates it, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The inclusion and exclusion step that handles a cap on each box is in [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion).
- The coefficient interpretation of a count of solutions to a linear equation is in [generating functions](/algorithms/combinatorics/generating-functions).
- The division that the exact computation performs, and the inverse that replaces it under a prime modulus, are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The enumeration that the count replaces, and the reference implementation that catches a wrong formula, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The discrete mathematics of bijections, permutations and multisets is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The count of paths on a grid, which is a binomial coefficient by a different argument, is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The subject index lists this technique, [stars and bars](/algorithms/combinatorics/stars-and-bars), beside the counting arguments it does not yet cover: [the combinatorics](/algorithms/combinatorics/).
