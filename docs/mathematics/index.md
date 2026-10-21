---
id: mathematics.overview
title: The mathematical reference
summary: "The part of the encyclopedia that does not depend on any particular algorithm: logic, proof, counting, modular arithmetic, number theory, probability, and the geometry formulas."
division: []
subjects: []
level: introductory
importance: extended-reference
keywords:
    [mathematics, logic, proof, counting, modular arithmetic, number theory, probability, geometry]
prerequisites:
    required: []
    recommended: [start.discrete-mathematics]
reviewed: false
---

Algorithms change. Contest problems change. The mathematics does not.

Every technique in this encyclopedia rests on a small number of mathematical facts, and those facts are stated once, here, with the conditions under which they hold and a short derivation of each. When an article in the [encyclopedia](/algorithms/) uses a formula, this page is where the formula is explained.

The page is a reference, not a course. Each section states the result, derives it, and links to the article that applies it. Read the section when a formula appears that you do not recognize, and read it in full once, because the derivations are what make the formulas usable rather than merely memorable.

## Sets, relations and functions

A **set** is a collection of distinct objects. Contest problems describe collections of objects constantly: the vertices of a graph, the indices of a subarray, the set of values that appear. Three properties of sets matter in algorithms: the elements are distinct, the order does not matter, and membership is a question with a yes-or-no answer.

A **relation** on a set $S$ is a subset of $S \times S$, that is, a set of ordered pairs. It says which pairs are related. The relations that appear most often are:

- An **equivalence relation**, which is reflexive, symmetric, and transitive. Reflexive means every element is related to itself; symmetric means if $a$ relates to $b$ then $b$ relates to $a$; transitive means if $a$ relates to $b$ and $b$ relates to $c$ then $a$ relates to $c$. Equivalence classes are the disjoint sets maintained by the [disjoint set union](/algorithms/graphs/dsu/), and the partition induced by a relation is exactly what that structure computes.
- A **partial order**, which is reflexive, antisymmetric, and transitive. A directed acyclic graph defines one by making $a < b$ when there is a path from $a$ to $b$, and the [topological sort](/algorithms/graphs/topological-sort/) computes a linear extension of it.
- A **total order**, in which every pair is comparable. A sorted array is a sequence in a total order.

A **function** from $A$ to $B$ assigns to each element of $A$ exactly one element of $B$. Two properties decide whether a mapping is invertible, and they decide it for a reason:

- **Injective**: distinct elements of $A$ map to distinct elements of $B$. The mapping has an inverse on its image.
- **Surjective**: every element of $B$ is the image of some element of $A$.

A function that is both injective and surjective is a **bijection**, and a bijection is the strongest counting tool in this page, because counting a set by finding a bijection to a set you can count gives the answer immediately.

**Where this applies.** The [disjoint set union](/algorithms/graphs/dsu/) maintains an equivalence relation. The [topological sort](/algorithms/graphs/topological-sort/) computes a linear extension of a partial order. The [prefix sums](/algorithms/arrays/prefix-sums/) article uses a mapping from a range to a difference of two prefix values.

## Logic, implication, equivalence and quantifiers

A **statement** is a sentence with a truth value. The connectives combine statements:

| Form                  | Reads as           | True when                      |
| --------------------- | ------------------ | ------------------------------ |
| $A \land B$           | A and B            | both are true                  |
| $A \lor B$            | A or B             | at least one is true           |
| $\neg A$              | not A              | A is false                     |
| $A \Rightarrow B$     | if A then B        | A is false, or B is true       |
| $A \Leftrightarrow B$ | A if and only if B | they have the same truth value |

**Implication is not equivalence, and the difference is the source of most mistakes in written arguments.** $A \Rightarrow B$ says that $A$ is sufficient for $B$; it does not say that $B$ is sufficient for $A$. The contrapositive $A \Rightarrow B$ is logically equivalent to $\neg B \Rightarrow \neg A$, and it is often the more useful form, because it lets you begin from what you want to prove and work backwards.

**Quantifiers** state how many objects satisfy a condition.

- $\forall x \in S,\ P(x)$: every element of $S$ satisfies $P$.
- $\exists x \in S,\ P(x)$: some element of $S$ satisfies $P$.

**Negation reverses both the quantifier and the predicate.** This is the one rule worth memorizing:

$$\neg\left(\forall x \in S,\ P(x)\right) \;\equiv\; \exists x \in S,\ \neg P(x)$$

$$\neg\left(\exists x \in S,\ P(x)\right) \;\equiv\; \forall x \in S,\ \neg P(x)$$

The derivation is a matter of counting witnesses. "Every element fails $P$" is witnessed by at least one element, because the statement asserts that all elements exist; "no element satisfies $P$" asserts that every element fails it. The rule is why a proof by contradiction typically starts by negating a universal claim and ends by producing one witness.

**Where this applies.** The [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) develops this material in the order a contest solution needs it, and the [correctness proofs](/start/from-ap-csa/part-6-contest-literacy/) in part 6 are written in exactly this vocabulary.

## Proof techniques

A **proof** is an argument that a claim follows from stated assumptions. In a contest the useful proof is short: a claim, the assumptions it needs, and the reason the result follows. These five forms cover almost every contest algorithm.

**Direct argument.** State the claim and derive it step by step. This is the default, and it is used when the result can be read off from the definitions.

**Mathematical induction.** To prove a claim for every natural number $n$, prove the base case $n = 0$ or $n = 1$, and prove the step from $k$ to $k+1$. The step is where the work is, and it usually takes the form "assume the claim for $k$, consider $k+1$, and show the $k+1$ case". The base case and the step together establish the claim for all $n$, because every natural number is reached by starting at the base and applying the step finitely many times.

**Proof by contradiction.** Assume the claim is false, derive a contradiction, and conclude the claim is true. This is the right form when the negation of the claim is easier to work with than the claim itself, and it is the engine of the counting arguments below.

**Invariant argument.** Find a statement about the program's state that holds before a loop and is preserved by each iteration, and show that the answer follows from it at the end. The invariant is the statement that makes the correctness of a data structure checkable, and the [Fenwick tree](/algorithms/range-queries/fenwick-tree/) article is written in this form.

**Exchange argument.** Take an optimal solution, find the place where it disagrees with the greedy choice, swap the two, and show the result is still feasible and no worse. This is the proof that makes a [greedy algorithm](/algorithms/greedy/) correct rather than merely plausible, and the [interval scheduling article](/algorithms/greedy/interval-scheduling/) develops it in full.

**The pigeonhole principle.** If $n$ objects are placed into $k$ boxes and $n > k$, then some box contains at least two objects. The generalization says that some box contains at least $\lceil n / k \rceil$ objects, which follows because if every box held at most $q$ objects then $kq \ge n$, so $q \ge \lceil n/k \rceil$. The principle is the counting core of the statement "there exist two objects with the same value", which appears constantly in contest problems. It is derived in the [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/).

**Where this applies.** The [contest problem-solving literacy part](/start/from-ap-csa/part-6-contest-literacy/) shows how to write each of these in three sentences under a clock.

## Summation and series

The **summation notation** $\sum_{i=1}^{n} a_i$ means $a_1 + a_2 + \cdots + a_n$. Two facts about it matter constantly.

**Counting the terms.** The sum $\sum_{i=1}^{n} a_i$ contains exactly $n$ terms. Off-by-one errors in a summation are the most common algebraic mistake in a contest solution, and the check is to count the terms before doing anything else with the formula.

**Splitting a sum.** $\sum_{i=1}^{n} (a_i + b_i) = \sum_{i=1}^{n} a_i + \sum_{i=1}^{n} b_i$, because the right side has exactly the same terms as the left, rearranged. This is what lets a [prefix sum](/algorithms/arrays/prefix-sums/) answer a range question by subtraction.

**The arithmetic series.** For $a, a+d, a+2d, \ldots, a+(n-1)d$, the sum is

$$\sum_{i=0}^{n-1} (a + id) = na + d\frac{n(n-1)}{2}$$

The derivation is to pair the first term with the last: each pair sums to $2a + (n-1)d$, there are $n$ terms and therefore $n/2$ pairs, and the product is the formula. The special case $a = 1$, $d = 1$ gives the sum of the first $n$ integers:

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

**The geometric series.** For $a, ar, ar^2, \ldots, ar^{n-1}$, the sum is

$$\sum_{i=0}^{n-1} ar^i = a\frac{r^{n} - 1}{r - 1} \quad \text{for } r \ne 1$$

The derivation multiplies the sum by $r$ and subtracts: $rS - S = ar^n - a$, and dividing by $r - 1$ gives the formula. The condition $r \ne 1$ is essential, because when $r = 1$ the sum is $na$ instead. Geometric series are what turn a repeated doubling of a quantity into a closed form, which is how problems with exponential structure are counted.

**Where this applies.** The [prefix sums article](/algorithms/arrays/prefix-sums/) is the computational form of the arithmetic series, and the [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) develops both series with their derivations.

## Counting

**Permutations.** The number of orderings of $n$ distinct objects is

$$n! = n \cdot (n-1) \cdots 1, \qquad 0! = 1$$

The derivation is a product rule: there are $n$ choices for the first position, then $n-1$ for the second, and so on. The convention $0! = 1$ makes the recurrence $n! = n \cdot (n-1)!$ hold at $n = 0$, and it corresponds to the single ordering of the empty set.

**Combinations.** The number of ways to choose $k$ of $n$ distinct objects, where order does not matter, is

$$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$$

The derivation counts orderings and then divides: each chosen subset of size $k$ gives exactly $k!$ orderings of its elements, and $(n-k)!$ orderings of the rest, so $n!$ orderings correspond to $\frac{n!}{k!(n-k)!}$ subsets. The identity $\binom{n}{k} = \binom{n}{n-k}$ follows because choosing $k$ is the same as leaving out $n-k$, and it is the reason the computation is usually written with $\min(k, n-k)$ in place of $k$.

**Overflow.** The largest binomial coefficient in row $n$ is $\binom{n}{\lfloor n/2 \rfloor}$, and it exceeds a signed 64-bit integer at $n = 67$. When the answer is required modulo a prime, the coefficient is never formed: it is computed modulo the prime throughout, with division replaced by a modular inverse. The [combinatorics subject](/algorithms/combinatorics/) works through both routes.

**Stars and bars.** The number of ways to distribute $n$ identical items into $k$ distinct boxes, with no box required to be empty, is

$$\binom{n+k-1}{k}$$

The derivation is a bijection: write $n$ stars and $k-1$ bars in a row, where the number of stars before the first bar is the count in box one, the number between the first and second bar is the count in box two, and so on. Every distribution gives exactly one such string and every such string gives exactly one distribution, so the count is the number of strings with $n$ stars and $k-1$ bars, which is $\binom{n+k-1}{k}$. If empty boxes are allowed, the count is $\binom{n+k-1}{n-1}$ instead, obtained by adding one item to each box first.

**Inclusion and exclusion.** For two sets, the union is counted by

$$|A \cup B| = |A| + |B| - |A \cap B|$$

because an element in both sets is counted twice by the sum and once by the intersection, so it is subtracted once. For three sets the same reasoning gives

$$|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|$$

with the triple intersection added back because it was subtracted three times and should be counted once. In general, one alternates the signs by the size of the intersection. The formula counts a set of configurations by subtracting the ones that violate a condition, and it is the standard tool for "at least one" and "none of" constraints.

**Where this applies.** The [combinatorics subject](/algorithms/combinatorics/) gives the computational forms, and the [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) derives each of these formulas from first principles.

## Modular arithmetic

**Congruence.** Two integers $a$ and $b$ are congruent modulo $m$, written $a \equiv b \pmod m$, when $m$ divides $a - b$. The condition requires $m \ge 1$. Congruence is an equivalence relation on the integers, and each equivalence class contains exactly one representative in $\{0, 1, \ldots, m-1\}$, which is the remainder.

Modular arithmetic is arithmetic on those equivalence classes. Addition and multiplication are well defined on them, because if $a \equiv b$ and $c \equiv d$ then $a + c \equiv b + d$ and $ac \equiv bd$.

**The modular inverse.** For $a$ and $m$ with $\gcd(a, m) = 1$, there is an $a^{-1}$ with

$$a \cdot a^{-1} \equiv 1 \pmod m$$

The condition $\gcd(a, m) = 1$ is necessary, not decorative: if a common divisor $g > 1$ divides both, then $a \cdot x$ is always divisible by $g$, so it can never be congruent to $1$. When the condition holds, the inverse is found with the extended Euclidean algorithm, which is described below.

**Fermat's little theorem.** If $p$ is prime and $a$ is not divisible by $p$, then

$$a^{p-1} \equiv 1 \pmod p$$

The condition that $p$ be prime is what makes the theorem true; the composite version is the Carmichael condition, which is weaker and much harder to use. Multiplying the congruence $a \cdot a^{-1} \equiv 1$ by $a^{p-2}$ gives the practical consequence:

$$a^{-1} \equiv a^{p-2} \pmod p$$

so a modular inverse modulo a prime is a modular power, computed in $O(\log p)$ time by repeated squaring.

**The Chinese remainder theorem.** Suppose $x \equiv a \pmod m$ and $x \equiv b \pmod n$, where $\gcd(m, n) = 1$. Then the system has a unique solution modulo $mn$, and it is

$$x \equiv a \cdot n \cdot n^{-1} + b \cdot m \cdot m^{-1} \pmod{mn}$$

where $n^{-1}$ is the inverse of $n$ modulo $m$, and $m^{-1}$ is the inverse of $m$ modulo $n$. The derivation is that the first term is congruent to $a$ modulo $m$ (because $n \cdot n^{-1} \equiv 1$ there) and to $0$ modulo $n$, while the second term is the mirror image, so their sum satisfies both congruences. The coprimality condition is what makes the two inverses exist, and it is also what makes the solution unique modulo $mn$.

**Where this applies.** The [number theory subject](/algorithms/number-theory/) is the computational treatment, and the [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) derives the congruence rules, the inverse condition, and Fermat's little theorem.

## Number theory

**The greatest common divisor.** $\gcd(a, b)$ is the largest positive integer dividing both. The Euclidean algorithm computes it by repeated replacement:

$$\gcd(a, b) = \gcd(b, a \bmod b)$$

The identity holds because the common divisors of $a$ and $b$ are exactly the common divisors of $b$ and $a - \lfloor a/b \rfloor b$. The algorithm terminates because the remainder is strictly smaller than the divisor, and it runs in $O(\log \min(a,b))$ steps.

**The extended Euclidean algorithm.** The same loop, extended to track coefficients, returns $x$ and $y$ with

$$ax + by = \gcd(a, b)$$

which is Bézout's identity. The coefficients are updated along with the remainders, and the invariant is that at every step the current remainder equals a linear combination of the original inputs with the coefficients held so far. When $\gcd(a,b) = 1$, the coefficient $x$ is the modular inverse of $a$ modulo $b$, since $ax + by = 1$ rearranges to $ax \equiv 1 \pmod b$.

**Primes.** A prime is an integer greater than $1$ whose only positive divisors are $1$ and itself. Every integer greater than $1$ has a unique prime factorization, and that uniqueness is what makes modular arithmetic over a prime field behave the way Fermat's little theorem requires.

**The sieve of Eratosthenes.** Mark the multiples of every prime up to $n$, starting from the square of the prime. It produces all primes up to $n$ in $O(n \log \log n)$ time and $O(n)$ space, because the number of marking operations is $\sum_{p \le n} n/p$ over primes $p$, and the sum of the reciprocals of the primes grows like $\log \log n$. The trial-division alternative costs $O(\sqrt n)$ per primality test, so a single test is cheap and a million tests are not.

**Where this applies.** The [number theory subject](/algorithms/number-theory/) is the computational treatment, and the [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) covers the gcd, the extended Euclidean algorithm, the sieve, and the primes.

## Probability and expected value

**Probability** is the measure of an event, ranging from $0$ to $1$, satisfying that the probability of an impossible event is $0$, that the probability of a certain event is $1$, and that the probability of the union of two disjoint events is the sum of their probabilities.

**Expected value.** For a random variable $X$ taking values in a finite set, the expected value is

$$\mathbb{E}[X] = \sum_{x} x \cdot \Pr[X = x]$$

For a program, the expected value is usually the expected number of operations or the expected number of comparisons, and it is what an amortized or randomized analysis bounds.

**Linearity of expectation.** For random variables $X_1, \ldots, X_k$,

$$\mathbb{E}\left[\sum_{i=1}^{k} X_i\right] = \sum_{i=1}^{k} \mathbb{E}[X_i]$$

The condition is that the expectation exists, and no independence is required. The proof is that the definition of expectation is a sum, and the sum of the sums can be rearranged. The absence of an independence requirement is what makes this the most useful tool in competitive analysis: in the quicksort argument, the pivot position is not independent of the subarray sizes, and the expectation is still computed by counting each element's expected number of comparisons separately.

**Where this applies.** The [discrete mathematics part](/start/from-ap-csa/part-3-discrete-mathematics/) develops probability and expected value, and the [advanced algorithms subject](/algorithms/advanced/) is where randomized techniques appear.

## Geometry formulas

All of these are exact. Contest geometry is integer geometry: the formulas are evaluated on exact integers wherever possible, because floating-point rounding produces answers that are wrong in the last digit, and the checker compares exactly.

**The dot product.** For vectors $u = (u_x, u_y)$ and $v = (v_x, v_y)$,

$$u \cdot v = u_x v_x + u_y v_y$$

It is a scalar, and it satisfies $u \cdot u = \|u\|^2$, which is how a squared distance is computed without a square root.

**The cross product.** In two dimensions the scalar cross product is

$$u \times v = u_x v_y - u_y v_x$$

It is the signed area of the parallelogram spanned by the two vectors. It is zero exactly when the vectors are parallel.

**The distance.** The Euclidean distance between two points is

$$\|p - q\| = \sqrt{(p_x - q_x)^2 + (p_y - q_y)^2}$$

and the Manhattan distance is

$$d_1(p, q) = |p_x - q_x| + |p_y - q_y|$$

which is the number of unit grid steps between the points. The metric must be read from the statement, because the two give different answers and contest problems rarely say which they mean.

**The orientation test.** For three points $a$, $b$, $c$, compute

$$t = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$

Then $t > 0$ means $c$ is to the left of the directed line $a \to b$, $t < 0$ means it is to the right, and $t = 0$ means the three points are collinear. The derivation is that $t$ is the cross product of $b - a$ and $c - a$, and the sign of a cross product gives the direction of the turn. **The zero case must be handled separately.** It is the single most common bug in contest geometry, and every algorithm built on the orientation test has three cases, not two.

**The area of a polygon.** For a polygon with vertices $p_1, \ldots, p_n$ in order, the shoelace formula gives

$$A = \frac{1}{2}\left|\sum_{i=1}^{n} \left(p_{i,x} p_{i+1,y} - p_{i+1,x} p_{i,y}\right)\right|$$

where the index $n+1$ is $1$. The derivation is that each term contributes the signed area of the triangle formed by the origin and the edge from $p_i$ to $p_{i+1}$, and for a polygon enclosing the origin these signed areas sum to the polygon's area. The absolute value is needed because the sum is signed: it is negative when the vertices are listed clockwise. The formula works for a non-convex polygon, and it gives zero for a self-intersecting one, which is not a polygon.

**Where this applies.** The [computational geometry subject](/algorithms/geometry/) is the algorithmic treatment, and the [binary representation part](/start/from-ap-csa/part-1-computational-foundations/) covers the exact integer arithmetic the cross product needs.
