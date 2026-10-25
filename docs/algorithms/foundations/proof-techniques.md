---
id: foundations.proof-techniques
title: The proof techniques
summary: Turn a claim about every input into a finite argument, and tell the difference between checking one case and proving a statement for all of them.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        proof,
        induction,
        direct proof,
        contradiction,
        contrapositive,
        pigeonhole principle,
        exchange argument,
        extremal principle,
        counterexample,
        loop invariant,
        constructive proof,
        proof by cases,
        double counting,
    ]
prerequisites:
    required: [foundations.loop-invariants]
    recommended: [foundations.complexity, foundations.recursion]
complexity:
    time: "a method, not an algorithm"
    space: "a method, not an algorithm"
assumptions:
    - The domain of every claim is stated before the proof, so that the base case and the quantified variable are unambiguous.
    - A proof is checked against its definitions and assumptions, not against the examples that suggested it.
implementations: foundations.proof-techniques
reviewed: false
---

<AlgorithmSummary algorithm="foundations.proof-techniques" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="foundations.proof-techniques" />

## At a glance

A **proof** is a finite argument that a statement holds for every input in a stated domain. The word that matters is _finite_. The statement may range over infinitely many values of $n$, but the argument has a fixed number of lines, and every line can be checked without running the program.

The running example is the identity

$$
1 + 3 + 5 + \cdots + (2n - 1) = n^2.
$$

It has three standard proofs. **Induction** anchors the chain at $n = 0$ and adds one more odd number at each step. **Direct summation** rewrites the left side as twice the sum of the first $n$ integers minus $n$, then simplifies. The **picture proof** partitions an $n \times n$ grid into $n$ L-shaped layers, the $k$-th layer containing $2k - 1$ cells. Each proof is short, each covers every $n \ge 0$, and each explains a different part of why the identity is true.

The reference program for this article is a checker. It reads one $n$, computes $n^2$ by multiplication, computes the odd sum by a loop, and prints both values followed by `MATCH` or `DIFFER`. On valid input it always prints `MATCH`, and that is the interesting fact: the program can check one $n$, while the theorem covers all of them. Running the program for every $n$ up to a million would still be a finite check, and a million and one would still be outside it.

A proof answers four questions: what is claimed, what is assumed, why each step follows, and which inputs the conclusion covers. The rest of this article makes those questions concrete, gives the three proofs in full, and shows which technique fits which claim in a contest.

## Problem motivation

A judge hands a program a finite set of tests. The program is accepted when it produces the right answer on that set. The set is large, but it is finite, and it is not shown to the contestant. The only way to predict the behavior on the tests that were not shown is to know why the program is correct on every valid input.

Consider the problem this article implements. The input is one nonnegative integer $n$. The output is $n^2$, the sum of the first $n$ odd numbers, and the word `MATCH` when the two values agree or `DIFFER` when they do not. A solution that hard-codes the answers for the sample cases passes the samples. A solution that uses the identity to compute both values passes every test, and would pass even if the identity were false, because both sides are the same computation. Neither solution has a proof, and the second one is worse: it looks correct and cannot fail, so it teaches nothing.

The same gap appears in every contest. A greedy rule matches the samples and fails on one arrangement the samples did not include. A formula fits the first five values and fails on the sixth. A binary search passes a target in the middle and loops forever on a target equal to the first element. In each case the evidence is finite and the claim is universal, and the step from one to the other is exactly what a proof supplies.

Two classical examples show how badly a finite check can mislead. The maximum number of regions into which $n$ points on a circle divide the disk, with every pair of points joined by a chord and no three chords concurrent, is

$$
1, 2, 4, 8, 16, 31, \ldots
$$

for $n = 1, 2, 3, \ldots$. The first five values invite the conjecture $2^{n-1}$; the sixth refutes it. The polynomial $n^2 + n + 41$ is prime for every $n$ from $0$ through $39$, and composite at $n = 40$, where it equals $41^2 = 1681$. Forty confirmations in a row are still not a proof.

The identity in this article is true, so every finite check of it succeeds and gives no warning. That is the dangerous case. A false conjecture at least has a chance of producing a counterexample; a true one produces confirmation after confirmation, and the confirmations say nothing about the inputs beyond the range that was tested.

## Recognition patterns

A claim needs a proof when it quantifies over more inputs than can be enumerated. The shapes below are the ones that appear most often in contest solutions.

- **A formula proposed from small values.** "The answer looks like $n^2$" is a conjecture. The proof is the reason the pattern continues.
- **A greedy choice.** The claim is not that the greedy choice is locally best, but that some optimal solution can be extended from it. That is an exchange argument, not a test.
- **An impossibility answer.** "No" or $-1$ needs an argument that every candidate fails, usually an invariant, a counting bound, or a contradiction.
- **An if-and-only-if classification.** "Exactly three divisors" is an iff, and each direction needs its own proof.
- **A lower bound.** "At least $n \log n$ comparisons" is a statement about all algorithms of a class, not about one program.
- **A loop whose boundary is fragile.** Binary search, two pointers, and sliding windows are correct because of an invariant, and the invariant is the proof.
- **A parity, divisibility, or modular claim.** These are usually direct proofs or proofs by cases.
- **An exchange between two choices.** Scheduling, matching, and ordering problems are where the exchange argument lives.

The signal in the statement is a quantifier: "for every", "always", "never", "for all $i < j$", "the minimum over all", "is it possible". The signal in the solution is a step that feels obvious and has not been justified. That step is where the proof belongs.

A finite check is enough in exactly two situations. The first is a domain that is genuinely finite and small enough to enumerate completely: if the problem fixes $n \le 20$ and asks about all subsets, then checking all $2^{20}$ subsets is a proof by exhaustion. The second is an existential claim with a small witness: producing one valid arrangement proves that an arrangement exists, and the construction is the proof. Neither situation applies to a formula over all $n$.

Testing is a separate activity. A test can refute a claim, and a refutation is valuable. A test cannot confirm a universal claim, because the next input is always available. Use tests to find counterexamples and proofs to rule them out.

## Naive approach

The baseline is to check the claim on many values and trust the pattern. For the running identity, the check is a short function.

```cpp
bool holds(long long n) {
    long long square = n * n;
    long long total = 0;
    for (long long k = 1; k <= n; ++k) {
        total += 2 * k - 1;
    }
    return square == total;
}
```

A driver loops over $n = 0, 1, \ldots, 10^6$, prints the first failure, and finds none. The experiment is real, the code is correct, and the conclusion "the identity holds" is still not justified. What has been established is the conjunction of one million specific statements, not the universal statement.

The same baseline appears in three disguises, and each one fails for the same reason.

- **No counterexample found, therefore no counterexample exists.** The first failure may be at $n = 10^6 + 1$, or at a value that the loop never reaches.
- **A pattern in the first few values, therefore the pattern continues.** The circle-regions sequence and the Euler polynomial are the standard counterexamples.
- **The sample input passes, therefore the judge's hidden tests pass.** The sample is chosen to illustrate the statement, not to separate correct solutions from incorrect ones.

The naive approach is not useless. It is the best way to falsify a conjecture before spending an hour proving it, and it is the oracle in a stress test. The rule is to use finite checks to refute and to use proofs to confirm. A check that finds a counterexample has done its job completely; a check that finds none has not finished the job.

There is a deeper version of the same mistake. Writing the checker so that both sides are computed the same way produces a program that cannot fail. The comparison is then a tautology, and the output `MATCH` carries no information. The experiment has to be independent of the claim, or it is not an experiment.

## Key insight

The insight that makes the identity provable, and not merely plausible, is that both sides count the same object. The number $n^2$ is the number of cells in an $n \times n$ grid. The odd numbers count the layers of that grid: the first odd number is the single cell of the $1 \times 1$ corner, the second is the L-shaped border that turns the $1 \times 1$ square into a $2 \times 2$ square, and in general the $k$-th odd number counts the border that turns a $(k-1) \times (k-1)$ square into a $k \times k$ square. The two sides are two descriptions of one set of cells.

That is a **double counting** argument, and it is the reason the identity is true rather than a coincidence of the first few values. Induction is the same argument written as a recurrence: each step adds exactly the new border. The direct proof is the same argument written in algebra: the borders have sizes $1, 3, 5, \ldots$ and their total telescopes to the area.

The general lesson is that a proof is not a longer test. It is a different kind of object. A test establishes a statement about one input. A proof establishes a statement about a variable, by using only finitely many steps that are valid for every value of that variable. The next sections make the rules of those steps precise.

## Visual intuition

The grid picture is the clearest one. Label every cell of an $n \times n$ grid by the larger of its row index and its column index, both starting at one.

```
n = 4, the label of a cell is max(row, column)

1 2 3 4
2 2 3 4
3 3 3 4
4 4 4 4
```

The cells labeled $k$ form an L: $k$ cells in row $k$, $k$ cells in column $k$, and the corner cell counted twice, so the layer has $k + k - 1 = 2k - 1$ cells. The four layers contain $1, 3, 5, 7$ cells. They are disjoint and they cover the grid, so

$$
1 + 3 + 5 + 7 = 16 = 4^2.
$$

The same picture for general $n$ gives the proof: every cell has exactly one label, the label-$k$ layer has $2k - 1$ cells, and the labels run from $1$ to $n$.

The pairing picture is a second way to see the sum. Write the terms in order and pair the first with the last, the second with the second to last, and so on.

```
n = 4:   1 + 3 + 5 + 7
         (1 + 7) + (3 + 5)
             8   +   8      = 2 * 8 = 16

n = 5:   1 + 3 + 5 + 7 + 9
         (1 + 9) + (3 + 7) + 5
            10   +   10   + 5 = 25
```

When $n$ is even there are $n/2$ pairs, each summing to $2n$, for a total of $n^2$. When $n$ is odd there are $(n-1)/2$ pairs summing to $2n$ plus the middle term $n$, for a total of $n(n-1) + n = n^2$. The pairing is the direct proof in pictures.

The induction ladder is the third view.

```
0^2 = 0
1^2 = 0^2 + 1
2^2 = 1^2 + 3
3^2 = 2^2 + 5
4^2 = 3^2 + 7
```

Each rung adds the next odd number, which is exactly the next border. The base case is the empty square, and the step is the act of adding a border.

The table below collects the three views for small $n$.

| $n$ | Next odd number | Sum of odds | $n^2$ | Picture       |
| --- | --------------- | ----------- | ----- | ------------- |
| 0   | none            | 0           | 0     | empty square  |
| 1   | 1               | 1           | 1     | one cell      |
| 2   | 3               | 4           | 4     | add an L of 3 |
| 3   | 5               | 9           | 9     | add an L of 5 |
| 4   | 7               | 16          | 16    | add an L of 7 |
| 5   | 9               | 25          | 25    | add an L of 9 |

## Formal model

Let $\mathbb{N} = \{0, 1, 2, \ldots\}$. Define the odd sum recursively by

$$
S(0) = 0, \qquad S(n) = S(n-1) + (2n-1) \quad \text{for } n \ge 1.
$$

The proposition under study is

$$
P(n) : S(n) = n^2, \qquad n \in \mathbb{N}.
$$

::: math definition Definition
A **proof** of a statement $\varphi$ from assumptions $\Gamma$ is a finite sequence $\varphi_1, \varphi_2, \ldots, \varphi_m = \varphi$ in which every $\varphi_i$ is an assumption in $\Gamma$, a definition, an axiom, or follows from earlier statements by a rule of inference.
:::

The definition is what separates a proof from an experiment. The sequence is finite, each step is local, and the last step is the claim. A reader can check each step without knowing anything about the values that were tested.

::: math definition Definition
A **counterexample** to the statement $\forall n \in D,\ P(n)$ is an element $n_0 \in D$ for which $P(n_0)$ is false.
:::

One counterexample disproves a universal statement. That asymmetry is the reason testing is powerful in one direction and powerless in the other.

::: math definition Definition
**Universal generalization.** If $P(n)$ is proved for an arbitrary $n \in D$, with no assumption about which element $n$ is, then $\forall n \in D,\ P(n)$ follows.
:::

Universal generalization is the rule that turns a proof about a symbol into a proof about a set. The phrase "let $n$ be arbitrary" is its signal. The proof may use the defining properties of $D$, but it may not use any other property of $n$, because the conclusion has to hold for every element.

::: math definition Definition
**Mathematical induction.** If $P(0)$ holds and, for every $k \in \mathbb{N}$, $P(k)$ implies $P(k+1)$, then $P(n)$ holds for every $n \in \mathbb{N}$.
:::

The two clauses are the **base case** and the **inductive step**. The assumption $P(k)$ inside the step is the **inductive hypothesis**. The principle is an axiom of the natural numbers, and it is equivalent to the well-ordering principle, which says that every nonempty subset of $\mathbb{N}$ has a least element.

::: math definition Definition
**Strong induction.** If, for every $n \in \mathbb{N}$, the assumption that $P(k)$ holds for all $k < n$ implies $P(n)$, then $P(n)$ holds for every $n \in \mathbb{N}$.
:::

Strong induction has no separate base case, because the case $n = 0$ assumes a statement about the empty set, which is vacuously true. It is convenient when the step needs more than the immediately preceding value, as in the proof that every integer greater than one has a prime factorization.

The remaining techniques are patterns of argument rather than separate axioms. Each one is a way of arranging the steps of a proof.

- **Direct proof.** Assume the hypotheses, apply definitions and known lemmas, and arrive at the conclusion. Universal generalization turns the result into a statement about the whole domain.
- **Proof by contradiction.** Assume the negation of the claim and derive a statement that is known to be false. The conclusion is that the negation was false.
- **Proof by contrapositive.** To prove $P \Rightarrow Q$, prove $\lnot Q \Rightarrow \lnot P$. The two implications are logically equivalent, and the contrapositive is often easier to derive.
- **Proof by cases.** Split the domain into finitely many parts that cover it, and prove the claim on each part. The pairing proof uses the cases "$n$ is even" and "$n$ is odd".
- **Pigeonhole principle.** If $m$ objects are placed in $n$ containers and $m > n$, some container holds at least two objects. The principle is a counting argument, not a construction.
- **Extremal principle.** Choose the smallest or largest object with a property, and derive a contradiction or a forced move from its position at the boundary.
- **Exchange argument.** To prove that a greedy choice is safe, take an optimal solution that does not make the choice, and exchange one of its elements for the greedy choice without making the solution worse.
- **Loop invariant.** State a predicate that holds before the loop and after every iteration, prove initialization and preservation, and show that the exit condition plus the invariant implies the answer. Termination is a separate claim, proved by a variant that strictly decreases.

A single proof may use several of these. The classification of T-primes in the worked problems uses a direct proof in one direction and a smallest-divisor argument in the other. The pigeonhole problem uses counting in both directions. The names describe the shape of the argument, not a required order of presentation.

## Algorithm derivation

The checker is deliberately simple, because the interesting part is what it does not assume.

```
read n
square <- n * n
total <- 0
for k <- 1 to n:
    total <- total + (2k - 1)
write square
write total
if square = total:
    write MATCH
else:
    write DIFFER
```

The design decision that matters is that the two sides are computed independently. The square comes from multiplication. The odd sum comes from the loop, one term at a time. If the program set `total = square`, or computed the total from the closed form, the comparison would be a tautology and would print `MATCH` for every input, including an input on which the identity fails. A checker must not assume the theorem it is checking.

### Derivation 1: direct summation

The direct proof needs the sum of the first $n$ integers.

::: math lemma Lemma
For every $n \ge 0$,

$$
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}.
$$
:::

The lemma is proved by pairing. If $n = 2m$, the terms pair as $(1, n), (2, n-1), \ldots, (m, m+1)$. There are $m$ pairs, each with sum $n+1$, so the total is $m(n+1) = \frac{n}{2}(n+1)$. If $n = 2m+1$, the same pairing leaves the middle term $m+1$ unpaired, and the total is

$$
m(n+1) + (m+1) = \frac{n-1}{2}(n+1) + \frac{n+1}{2} = \frac{n(n+1)}{2}.
$$

Both cases agree with the formula, and the two cases cover every $n$.

Now sum the odd numbers.

$$
S(n) = \sum_{k=1}^{n}(2k-1) = 2\sum_{k=1}^{n}k - \sum_{k=1}^{n}1 = 2 \cdot \frac{n(n+1)}{2} - n = n(n+1) - n = n^2.
$$

The derivation uses only the distributive law, the lemma, and algebra. It is a direct proof by universal generalization, because $n$ was arbitrary.

### Derivation 2: induction

The recursive definition of $S$ matches the induction principle exactly.

- **Base case.** $S(0) = 0 = 0^2$.
- **Inductive step.** Let $k \ge 0$ and assume $S(k) = k^2$. Then

$$
S(k+1) = S(k) + (2(k+1)-1) = k^2 + 2k + 1 = (k+1)^2.
$$

The base case anchors the chain, and the step moves from each link to the next. Applying the principle once, schematically, covers every $n$; the proof does not contain $n$ separate steps. That is why a finite argument can prove an infinite statement.

The step is not circular. It assumes $P(k)$ for one fixed $k$ and proves $P(k+1)$ for that same $k$. The induction principle then quantifies over every $k$. Confusing the hypothesis with the conclusion is the most common way to write an invalid induction.

### Derivation 3: the picture

Partition the cells of an $n \times n$ grid by the larger of their two indices. Define

$$
L_k = \{\, (i,j) : 1 \le i,j \le n,\ \max(i,j) = k \,\}, \qquad 1 \le k \le n.
$$

Every cell has exactly one maximum, so the sets $L_1, \ldots, L_n$ are pairwise disjoint and their union is the whole grid. The size of $L_k$ is the number of cells in the $k \times k$ square minus the number in the $(k-1) \times (k-1)$ square:

$$
|L_k| = k^2 - (k-1)^2 = 2k - 1.
$$

Therefore

$$
n^2 = \sum_{k=1}^{n}|L_k| = \sum_{k=1}^{n}(2k-1) = 1 + 3 + \cdots + (2n-1).
$$

The picture is not the proof by itself. The proof is the partition, the count of each layer, and the observation that the layers cover the grid without overlap. The picture is a notation for those three facts. A drawing without the count is a suggestion, not an argument.

### What each proof adds

The direct proof is the most algebraic, and it is the one to reproduce under time pressure once the arithmetic-series lemma is known. It depends on that lemma, which is itself proved by pairing. The induction proof matches the recursive definition of the sum and generalizes to any recursively defined quantity. The picture proof explains why the identity is true, and it suggests the generalizations: the sum of the first $n$ cubes is the square of the sum of the first $n$ integers, and that identity has a three-dimensional picture.

All three prove the same proposition. A proof is not required to be unique, and a second proof is often the best check on the first: if two arguments reach the same conclusion by different routes, the chance that both contain the same hidden assumption is smaller.

## Step-by-step execution

Take $n = 4$. The program computes the square once, then runs the loop four times.

| $k$ | $2k-1$ | `total` after the iteration | $k^2$ |
| --- | ------ | --------------------------- | ----- |
| 0   | none   | 0                           | 0     |
| 1   | 1      | 1                           | 1     |
| 2   | 3      | 4                           | 4     |
| 3   | 5      | 9                           | 9     |
| 4   | 7      | 16                          | 16    |

The output is

```
16
16
MATCH
```

The loop invariant can be read directly from the `k^2` column: after the iteration for $k$, `total` equals $k^2$. The invariant is not assumed; it is observed in the table and proved in the next section.

Take $n = 0$. The square is $0 \cdot 0 = 0$, the loop body never runs, `total` is $0$, and the output is

```
0
0
MATCH
```

The empty sum is zero by definition, and zero is also $0^2$. This is the edge case that a program written with a `do-while` loop would get wrong, because the body would run once and add $2 \cdot 1 - 1 = 1$.

Take $n = 1$. The square is $1$, the loop runs once and adds $1$, and the output is

```
1
1
MATCH
```

Now trace the three proofs at $n = 4$. The induction chain is $0 \to 1 \to 4 \to 9 \to 16$, adding $1, 3, 5, 7$. The pairing is $(1+7) + (3+5) = 8 + 8 = 16$. The picture has four layers of sizes $1, 3, 5, 7$ and a total of $16$ cells. The traces agree because they are three descriptions of one computation.

The `DIFFER` branch is never reached on a valid input, and the program still contains it. The branch is the experiment: it reports what the two independent computations produced. Removing it because the theorem says it is unreachable would make the program depend on the theorem, which is the circularity the derivation warned against.

## Correctness proof

::: math theorem Theorem
For every $n \in \mathbb{N}$, $\displaystyle\sum_{k=1}^{n}(2k-1) = n^2$.
:::

::: math proof Proof
The proof is by induction on $n$.

**Base case.** For $n = 0$ the sum is empty and equals $0$, and $0^2 = 0$, so the statement holds.

**Inductive step.** Let $k \ge 0$ and assume the statement holds for $k$, that is, $S(k) = k^2$. The definition of $S$ and the inductive hypothesis give

$$
S(k+1) = S(k) + (2(k+1)-1) = k^2 + 2k + 1 = (k+1)^2.
$$

So the statement holds for $k+1$. By the induction principle, it holds for every $n \in \mathbb{N}$. $\square$
:::

The same proposition has a direct proof, which is independent of the induction principle.

::: math lemma Lemma
For every $n \ge 0$, $\displaystyle\sum_{k=1}^{n}k = \frac{n(n+1)}{2}$.
:::

::: math proof Proof
If $n = 2m$, pair the $k$-th term with the $(n+1-k)$-th term. Each of the $m$ pairs sums to $n+1$, so the total is $m(n+1) = \frac{n(n+1)}{2}$.

If $n = 2m+1$, the same pairing leaves the middle term $m+1 = \frac{n+1}{2}$ unpaired, and the total is

$$
m(n+1) + \frac{n+1}{2} = \frac{n-1}{2}(n+1) + \frac{n+1}{2} = \frac{n(n+1)}{2}.
$$

The two cases cover every nonnegative integer. $\square$
:::

::: math theorem Theorem
For every $n \in \mathbb{N}$, $\displaystyle\sum_{k=1}^{n}(2k-1) = n^2$.
:::

::: math proof Proof
By the lemma and the distributive law,

$$
\sum_{k=1}^{n}(2k-1) = 2\sum_{k=1}^{n}k - \sum_{k=1}^{n}1 = 2 \cdot \frac{n(n+1)}{2} - n = n(n+1) - n = n^2.
$$

The argument holds for an arbitrary $n$, so universal generalization gives the statement for every $n \in \mathbb{N}$. $\square$
:::

The picture argument is the third proof of the same proposition.

::: math theorem Theorem
For every $n \ge 0$, $\displaystyle\sum_{k=1}^{n}(2k-1) = n^2$.
:::

::: math proof Proof
For $1 \le k \le n$, let $L_k = \{(i,j) : 1 \le i,j \le n,\ \max(i,j) = k\}$. Every cell $(i,j)$ of the $n \times n$ grid has exactly one value of $\max(i,j)$, so the sets $L_1, \ldots, L_n$ are pairwise disjoint and their union is the whole grid, which has $n^2$ cells.

The set $L_k$ is the $k \times k$ square minus the $(k-1) \times (k-1)$ square, so

$$
|L_k| = k^2 - (k-1)^2 = 2k - 1.
$$

Summing the layer sizes counts every cell exactly once:

$$
n^2 = \sum_{k=1}^{n}|L_k| = \sum_{k=1}^{n}(2k-1).
$$

The case $n = 0$ is the empty sum and the empty grid, both zero. $\square$
:::

The three proofs establish the same identity, but a program is not the identity. The next theorem connects the code to the mathematics.

::: math theorem Theorem
On input $n$ with $0 \le n \le 10^7$, the reference program terminates, prints $n^2$, prints $S(n)$, and prints `MATCH`.
:::

::: math proof Proof
The program reads one integer $n$ and rejects a negative value. The multiplication $n \ast n$ is exact in a signed 64-bit integer because $n^2 \le 10^{14} < 2^{63}-1$.

For the loop, let $i$ be the number of completed iterations and let $T_i$ be the value of `total` after $i$ iterations. The loop invariant is $T_i = S(i)$ for every $i$ with $0 \le i \le n$.

- **Initialization.** Before the loop, $i = 0$ and $T_0 = 0 = S(0)$.
- **Preservation.** If the invariant holds at the start of an iteration with counter value $k = i+1$, the body adds $2k-1 = 2(i+1)-1$ to $T_i$, so the new value is $T_i + 2(i+1)-1 = S(i) + 2(i+1)-1 = S(i+1)$.
- **Termination.** The counter starts at $1$ and increases by one on each iteration, so the loop stops after exactly $n$ iterations. The variant $n - i$ is a nonnegative integer that strictly decreases.

At exit, $i = n$ and $T_n = S(n)$. The program prints $n^2$, then $S(n)$, then compares the two values with an exact integer comparison. By the identity theorem, $S(n) = n^2$, so the comparison succeeds and the program prints `MATCH`. $\square$
:::

The proof is relative to a model: signed 64-bit integers with no overflow, a loop that executes its body exactly $n$ times, and an input that satisfies $0 \le n \le 10^7$. A proof about a program is always a proof about a program under a model. When the model is violated, for example by a 32-bit multiplication that wraps around, the theorem no longer applies, and the program can print `DIFFER` for an input on which the identity is true.

## Complexity analysis

The program is linear in $n$, and the linear loop is the point rather than an accident.

| Quantity | Cost | Reason |
| --- | --- | --- |
| Time | $\Theta(n)$ | the loop performs $n$ iterations |
| Auxiliary space | $O(1)$ | two accumulators and one counter |
| Multiplications | $n+1$ | one for the square, one per odd term |
| Additions and subtractions | $2n$ | $2k-1$ and the running total |
| Comparisons | $n+2$ | the loop bound checked $n+1$ times, then the equality |
| Output | $O(1)$ | three lines |
| Proof length | $O(1)$ | a fixed number of steps, independent of $n$ |
| Checking every $n \le N$ | $\Theta(N^2)$ | each check costs $\Theta(n)$ |

The last two rows are the comparison the article is about. A proof is a constant-size object that covers every $n$. A finite check of the first $N$ values costs $\Theta(N^2)$ time and still covers only $N+1$ values. Increasing $N$ buys more cases, never the universal statement.

| $n$    | Loop iterations | Time   | Space  |
| ------ | --------------- | ------ | ------ |
| 0      | 0               | $O(1)$ | $O(1)$ |
| 1      | 1               | $O(1)$ | $O(1)$ |
| 10     | 10              | $O(n)$ | $O(1)$ |
| $10^3$ | $10^3$          | $O(n)$ | $O(1)$ |
| $10^6$ | $10^6$          | $O(n)$ | $O(1)$ |
| $10^7$ | $10^7$          | $O(n)$ | $O(1)$ |

The integer width needs its own table, because the program's output depends on exact arithmetic.

| Type                | Largest exact integer                  | Largest $n$ with $n^2$ exact |
| ------------------- | -------------------------------------- | ---------------------------- |
| signed 32-bit       | $2^{31}-1 \approx 2.15 \times 10^9$    | $46\,340$                    |
| signed 64-bit       | $2^{63}-1 \approx 9.22 \times 10^{18}$ | $3\,037\,000\,499$           |
| JavaScript `Number` | $2^{53}-1 \approx 9.01 \times 10^{15}$ | $94\,906\,264$               |

The largest safe value is $n = 46\,340$, whose square is $2\,147\,395\,600$. At $n = 46\,341$ the square is $2\,147\,488\,281$, which exceeds $2^{31}-1 = 2\,147\,483\,647$ by $4\,634$, so a signed 32-bit multiplication overflows. The exact arithmetic is why every reference implementation uses a 64-bit type or a wider one, and why the contract caps $n$ at $10^7$.

The proof has no such table. Its cost is the cost of checking a fixed number of inferences, and that cost does not grow with the value of $n$ being claimed. The asymmetry is the whole reason proofs exist.

## Algorithm selection

The shape of the claim determines the technique. The table below is the one to consult before starting a proof.

| Claim shape | Technique | Why it fits |
| --- | --- | --- |
| A property of every natural number, defined recursively | Induction or strong induction | The step consumes the recursive structure |
| A closed form built from known sums | Direct proof | Algebra plus a lemma is shorter than an induction |
| A counting identity with two interpretations | Double counting or a picture | Both sides count one set |
| A greedy choice is safe | Exchange argument | An optimal solution is transformed, not enumerated |
| A task is impossible | Contradiction, invariant, or counting bound | A positive construction cannot prove a negative |
| A classification with "if and only if" | Two direct proofs, one per direction | Each direction has different hypotheses |
| An object exists | Construction | The witness is the proof |
| An object is unique | Contradiction | Assume two and show they are equal |
| A loop returns the right value | Invariant plus variant | Initialization, preservation, termination, sufficiency |
| A lower bound on all algorithms | Adversary or counting argument | One program cannot establish a statement about all programs |
| $n+1$ objects in $n$ categories | Pigeonhole principle | The counting forces a collision |
| A minimum or maximum is attained | Extremal principle | The boundary element forces the next step |
| The domain is finite and small | Exhaustive enumeration | Every case is checked, so the proof is complete |
| The claim is suspected to be false | Counterexample search, then repair | A single witness refutes it |

Three distinctions matter when choosing.

First, a finite check is a proof only when the domain is finite and the enumeration is exhaustive. "All $2^{20}$ subsets" is a finite domain, and checking all of them is a proof by cases. "The first $2^{20}$ integers" is a prefix of an infinite domain, and checking it proves nothing about the rest. The word "exhaustive" is doing the work.

Second, testing and proving answer different questions. A stress test with a brute-force oracle is the best tool for finding a counterexample and the worst tool for establishing a theorem. When a solution is submitted, the judge runs a finite set of tests; a proof is what makes the solution credible on the tests the judge did not run.

Third, the technique follows the claim, not the taste of the author. If the claim describes a process that repeats, use induction or an invariant. If it describes a choice, use an exchange argument. If it describes a count, count the same object in two ways. If it describes an impossibility, look for a quantity that cannot change. The three proofs of the running identity are three ways of answering the same question, and any of them is acceptable; the direct proof is usually the fastest to write when the arithmetic-series lemma is already known.

## Reference implementations

The six reference programs implement one contract.

```
Input:
  n                       (0 <= n <= 10^7)

Output:
  line 1: n^2
  line 2: 1 + 3 + ... + (2n - 1)
  line 3: MATCH if the two values are equal, DIFFER otherwise
```

The odd sum is computed by a loop from $1$ to $n$, one term at a time. The square is computed by a single multiplication. The two computations are independent by design, so the comparison is an experiment rather than a tautology.

| Language | File | Value type | Loop | Note |
| --- | --- | --- | --- | --- |
| C | `c/program.c` | `long long` | `for` | Reads with `scanf`, prints with `printf` |
| C++17 | `cpp17/program.cpp` | `long long` | `for` | Uses `std::cin` and `std::cout` |
| Java | `java/Main.java` | `long` | `for` | Class `Main`, reads with `Scanner` |
| Python | `python/program.py` | arbitrary precision | `for` | Reads all tokens from standard input |
| Pascal | `pascal/program.pas` | `Int64` | `while` | Compiles under pas2js; `SysUtils`, one argument per `Read` |
| JavaScript | `javascript/program.js` | `Number` | `for` | Reads standard input from the `process.stdin` stream |

All six are `program` variants. They read standard input, write standard output, and are marked unverified until a reviewer runs them. The compiled languages use 64-bit values because $n^2$ leaves the 32-bit range at $n = 46\,341$. JavaScript's `Number` is exact for every integer up to $2^{53}-1$, which covers the contract's maximum of $10^7$ with room to spare.

Every program prints exactly three lines, with no trailing spaces. The shared fixtures compare the six outputs byte for byte after line-ending normalization. The programs never print the intermediate sums; the trace belongs in the article, not in the output.

The Pascal version is written to compile under pas2js as well as Free Pascal. It uses `SysUtils` for `IntToStr`, reads one argument per `Read` call, and avoids `IOResult`. The JavaScript and Pascal files open with the required educational-reference notice, because neither language is accepted by the USACO judge.

## Recursion decision

Induction and recursion have the same shape. The base case of the induction is the base case of the recursion, and the inductive step is the recursive call. The proof of the checker is recursive in structure even though the program is a loop.

A recursive version of the sum is short.

```cpp
long long sum_odds(long long n) {
    if (n == 0) return 0;
    return sum_odds(n - 1) + (2 * n - 1);
}
```

Its depth is $n$, and its time is $O(n)$. For $n = 10^7$ it would need ten million stack frames, which exceeds the default stack of every mainstream language. The loop keeps the same state in two variables and uses $O(1)$ stack space. The recursion is still present in the proof: the invariant is proved by the same base-and-step argument, and the loop counter is the induction variable.

The choice between the two forms is therefore not a choice about the mathematics. It is a choice about the machine. A recursion whose depth is logarithmic, such as the one in binary search, is safe and often clearer. A recursion whose depth is $n$ is safe only for small $n$, or when the language guarantees tail-call elimination, which none of the six reference languages guarantees in every implementation. The full set of language limits is in [recursion](/algorithms/foundations/recursion).

For proofs about trees and divide-and-conquer algorithms, the recursion is structural rather than numeric: the induction is on the height of the tree or on the size of the subproblem. The depth of the proof follows the depth of the object, not the depth of the program. The two should not be confused when a recursive algorithm is replaced by an iterative one.

## Implementation walkthrough

The core of every reference program is the same four lines.

```cpp
long long square = n * n;
long long total = 0;
for (long long k = 1; k <= n; ++k) {
    total += 2 * k - 1;
}
```

The first line computes the left side by multiplication. The loop computes the right side by its definition. The body uses `2 * k - 1`, not `2 * k + 1`: the first odd number is $1$, and the expression has to produce $1$ when $k = 1$. An off-by-one here produces a sum that starts at $3$ and is too large by $2n$, which the comparison will report as `DIFFER` on every positive input.

The output is written once, after the loop.

```cpp
std::cout << square << '\n' << total << '\n';
std::cout << (square == total ? "MATCH" : "DIFFER") << '\n';
```

The comparison is an exact integer comparison. There is no tolerance and no floating point. A program that computed the square with `pow(n, 2)` and compared doubles would be correct for small $n$ and wrong near the precision limit, and the failure would look like a mathematical counterexample rather than a numerical one.

The edge cases are worth checking in this order.

- **$n = 0$.** The loop body never runs, `total` stays $0$, and the output is `0`, `0`, `MATCH`. A `do-while` loop would run once and fail.
- **$n = 1$.** The loop runs once, adds $1$, and the output is `1`, `1`, `MATCH`.
- **$n = 46\,341$.** In a 32-bit type, the square overflows and the program may print `DIFFER` for a true identity. Use `long long`, `long`, or `Int64`.
- **$n = 10^7$.** The square is $10^{14}$, which fits in 64 bits and in a JavaScript `Number`; the loop performs $10^7$ iterations, which is the price of the independent check.
- **Negative $n$.** The identity is stated for $n \ge 0$, so the program rejects the input and prints nothing. A program that treated a negative value as a valid size would run zero iterations and print a positive square, which is not a meaningful comparison.
- **Trailing whitespace or extra tokens.** Token-based readers ignore them; a line-based reader that expects exactly one line also works, because the input is one integer.

The language details are mechanical once the core is fixed. C reads with `scanf("%lld", &n)`. C++ reads with `std::cin >> n`. Java reads with `Scanner.nextLong()` and stores the result in a `long`. Python reads all tokens with `sys.stdin.buffer.read().split()` and uses arbitrary-precision integers. Pascal reads with `Read(N)` into an `Int64` and prints with `WriteLn(IntToStr(...))`. JavaScript reads the `process.stdin` stream, converts the first token with `Number`, and writes with `process.stdout.write`.

The one design rule that the walkthrough keeps returning to is that the checker must not use the theorem. The loop is slower than the identity and that is deliberate. It is the independent computation that gives the comparison its meaning.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Checking the first few values and concluding | A failure after the tested range is invisible | Find the structure and prove it, or state the check as a conjecture |
| Omitting the base case | The step proves only conditional statements, so nothing is anchored | Prove $P(0)$ explicitly |
| Using the claim inside its own proof | The argument is circular and proves nothing | Keep the inductive hypothesis separate from the goal |
| Computing both sides of the check the same way | The comparison is a tautology and always prints `MATCH` | Compute each side from its own definition |
| Writing `2 * k + 1` | The sum starts at $3$ and is too large by $2n$ | Use `2 * k - 1` for the $k$-th odd number |
| Proving the converse | $Q \Rightarrow P$ does not prove $P \Rightarrow Q$ | Write the direction of the claim before starting |
| Forgetting $n = 0$ | The empty sum and the empty grid are both zero, but a `do-while` disagrees | Test the empty input first |
| Drawing a picture without a count | The picture suggests a proof but does not replace one | State the partition and the size of each part |
| Squaring in 32 bits | Overflow produces a wrong value or a false `DIFFER` | Widen the type before multiplying |
| Reading $n$ as `int` and squaring as `int` | The overflow happens before the assignment to a wider type | Convert to `long long` or `long` first |
| Extrapolating $1, 2, 4, 8, 16$ | The next value can be $31$ | Treat a pattern as a conjecture and look for the rule |
| Treating "no counterexample" as "proved" | The next input is always untested | Use tests to refute and proofs to confirm |

### Why this fails: the missing base case

A proof can have a perfectly valid inductive step and still prove nothing, because the step is a conditional and the base case is the only unconditional statement in the chain.

Consider the claim

$$
Q(n) : 2 + 4 + \cdots + 2n = n(n+1) + 1.
$$

The inductive step is valid. Assume $Q(k)$. Then

$$
2 + 4 + \cdots + 2k + 2(k+1) = k(k+1) + 1 + 2k + 2 = k^2 + 3k + 3 = (k+1)(k+2) + 1,
$$

which is exactly $Q(k+1)$. The algebra is correct for every $k \ge 1$. The base case is false: at $n = 1$ the left side is $2$ and the right side is $3$.

The smallest counterexample is therefore $n = 1$, and the step that looked like a proof proves only that a false statement implies another false statement. This is the cleanest demonstration that the base case is not a formality. A chain of implications with no anchor reaches nothing.

### Why this fails: a finite check of a true-looking pattern

The polynomial $p(n) = n^2 + n + 41$ is prime for every $n$ from $0$ through $39$. A program that checks the first forty values finds no counterexample and reports success. At $n = 40$,

$$
p(40) = 40^2 + 40 + 41 = 1600 + 40 + 41 = 1681 = 41^2,
$$

which is composite. The smallest counterexample is $n = 40$.

The lesson is not that forty checks are worthless. The checks are a true statement about forty values, and they are the evidence that suggested the conjecture. The lesson is that a universal claim is not a conjunction of finitely many instances. The same gap appears in the circle-regions sequence $1, 2, 4, 8, 16, 31$: the first five values suggest a doubling rule that the sixth value refutes.

### Why this fails: a circular check

Suppose the checker is written as

```cpp
long long square = n * n;
long long total = n * n;
```

and then compares `square` with `total`. The program prints `MATCH` for every input, including every input on which the identity would fail. The comparison cannot fail because both sides are the same expression, and an experiment that cannot fail is not an experiment.

The same circularity appears in a proof that assumes the conclusion, and in a brute-force oracle that calls the fast solution it is supposed to check. The remedy is always the same: compute each side from its own definition, or prove each statement from assumptions that do not include it.

## Variants and extensions

- **Strong induction.** The step may assume every smaller value, not only the immediate predecessor. The standard example is that every integer $n \ge 2$ is a product of primes: if $n$ is prime, it is its own product; otherwise $n = ab$ with $1 < a, b < n$, and the induction hypothesis factors both $a$ and $b$.
- **Well-ordering and minimal counterexamples.** To prove $\forall n\, P(n)$, assume a counterexample exists and choose the smallest one. The minimality often forces a smaller counterexample, which is a contradiction. Infinite descent is the same argument run downward.
- **Structural induction.** For strings, lists, trees, and graphs, the induction is on the structure rather than on a number: a string is empty or a character followed by a shorter string, a tree is a node with subtrees. The base cases are the empty structures.
- **Loop invariants and variants.** The program-correctness form of induction. The invariant is the preserved statement and the variant is the decreasing quantity that proves termination. The full method is in [loop invariants](/algorithms/foundations/loop-invariants).
- **Exchange arguments.** The standard proof for greedy algorithms. Take an optimal solution that differs from the greedy one, exchange the first differing choice, and show that the result is still optimal. The interval scheduling problem is the clean example.
- **The extremal principle.** Choose the leftmost, smallest, or largest object with a property and use its position to force the next step. It is the proof technique behind many "there is always a move" arguments.
- **The pigeonhole principle.** If $n+1$ objects occupy $n$ categories, two share a category. It proves existence without constructing the collision, which is often enough.
- **Double counting.** Count one set in two ways and equate the results. The odd-number identity is the smallest example; the handshake lemma and many binomial identities are larger ones.
- **Contradiction and contrapositive.** Assume the negation, or prove the reversed implication. Both are useful when a direct construction is hard to find.
- **Constructive and nonconstructive existence.** A construction proves that an object exists and gives it. A counting argument can prove that one exists without producing it. When the problem asks for the object, the nonconstructive proof is only the first half.
- **Generalizations of the identity.** The sum of the first $n$ cubes is $\left(\frac{n(n+1)}{2}\right)^2$, the arithmetic series is $\frac{n(a_1 + a_n)}{2}$, and telescoping sums collapse because consecutive terms cancel. Each has a direct proof, an induction proof, and often a picture.
- **Formal verification and testing.** A machine-checked proof removes the possibility of a logical slip but not the possibility of a wrong model. Testing finds counterexamples but cannot establish a universal statement. The two tools answer different questions and are strongest together.

## Contest strategy

A fixed procedure that survives time pressure.

1. Write the claim in one sentence, with its quantifier and its domain. "For every $n \ge 0$, the odd sum is $n^2$" is a claim; "the odd sum is $n^2$" is ambiguous at $n = 0$.
2. Test small values to find the pattern, and write down the first value that does not fit. Testing is for guessing and for refuting, not for finishing.
3. Choose the technique by the shape of the claim. A recursive definition suggests induction; a choice suggests an exchange argument; a count suggests double counting; an impossibility suggests an invariant.
4. Write the base case first. If it is false, the claim is false, and no amount of work on the step will repair it.
5. Write the step as an implication. Assume the hypothesis for one fixed value, derive the conclusion for the next value, and do not assume the conclusion.
6. For a greedy solution, write the exchange: which element of the optimal solution is replaced, and why the result is no worse. If the exchange cannot be written, the greedy rule is probably wrong.
7. For a loop, write the invariant and the variant. The invariant explains the answer and the variant explains why the loop stops.
8. Check the boundaries: $n = 0$, $n = 1$, the largest input, a negative or malformed input, and a value that overflows the declared type.
9. Stress test against a brute-force oracle on small random inputs. A failure is a counterexample and a gift; a pass is evidence, not a proof.
10. Write the proof in a comment above the function. Three lines are enough for most contest solutions, and the comment is what a teammate reads when the solution fails.

The strategy is ordered by cost. A counterexample found in step 2 saves the work of steps 3 through 9. A base case checked in step 4 saves a wrong submission. A proof written in step 10 costs a minute and is the only part of the process that covers the tests the judge did not show.

## Worked problems

### Problem 1: Kuroni and Impossible Calculation

**Restatement.** Given $n$ integers $a_1, \ldots, a_n$ and a modulus $m$, compute

$$
\prod_{1 \le i < j \le n}|a_i - a_j| \bmod m.
$$

Constraints: $2 \le n \le 2 \times 10^5$, $1 \le m \le 1000$, $0 \le a_i \le 10^9$.

**Naive baseline.** Enumerate every pair, multiply the absolute differences modulo $m$. The work is $\binom{n}{2} = \Theta(n^2)$, which is about $2 \times 10^{10}$ pairs at the limit and far too slow.

**Insight.** If $n > m$, two of the $n$ values leave the same remainder modulo $m$. Their difference is a multiple of $m$, so the product is divisible by $m$ and the answer is zero. Otherwise $n \le m \le 1000$, and the quadratic enumeration is small.

**Derivation.** There are $m$ possible remainders modulo $m$ and $n$ values. If $n > m$, the pigeonhole principle gives indices $i \ne j$ with $a_i \equiv a_j \pmod m$. Then $m$ divides $a_i - a_j$, so $m$ divides the whole product, and the product modulo $m$ is zero. If $n \le m$, run the pairwise product, reducing modulo $m$ after every multiplication.

**Correctness.** In the case $n > m$, the product contains the factor $|a_i - a_j|$, which is a positive multiple of $m$ unless the two values are equal; if they are equal, the factor is zero, and the product is zero as well. In both subcases the product is $0 \bmod m$. In the case $n \le m$, the algorithm multiplies exactly the factors defined by the statement, reducing after each step, and reduction modulo $m$ is compatible with multiplication.

**Complexity.** Reading the input is $O(n)$. The product is $O(n^2)$ only when $n \le m \le 1000$, so the total is $O(n + m^2)$ time and $O(n)$ space for the array.

**Common wrong approach.** Multiplying all pairs without the pigeonhole shortcut, which is $O(n^2)$ at $n = 2 \times 10^5$. Another error is to sort the values first and assume that adjacent differences are the only ones that matter; that changes the product. A third is to accumulate the product in a 64-bit integer and reduce only at the end, which overflows long before the product is complete; reduce modulo $m$ after every multiplication.

### Problem 2: T-primes

**Restatement.** A positive integer is a T-prime when it has exactly three distinct positive divisors. Given $n$ values $x_i$ with $n \le 10^5$ and $x_i \le 10^{12}$, decide for each whether it is a T-prime.

**Naive baseline.** For each value, trial-divide up to $\sqrt{x_i}$ and count the divisors. The cost is $O(n\sqrt{x_{\max}}) = 10^5 \cdot 10^6 = 10^{11}$ operations, far too slow.

**Insight.** A number has exactly three divisors if and only if it is the square of a prime.

**Derivation.** Prove both directions.

If $x = p^2$ for a prime $p$, the divisors of $x$ are exactly $1$, $p$, and $p^2$. They are distinct because $p \ge 2$, so $1 < p < p^2$. The divisors of $p^2$ are the numbers $p^e$ with $0 \le e \le 2$, so there are exactly three.

Conversely, suppose $x$ has exactly three divisors. The number $1$ has one divisor and every prime has two, so $x$ is composite and greater than one. Write $x = a \cdot b$ with $1 < a \le b < x$. The divisors $1$, $a$, $b$, and $x$ are all distinct unless $a = b$. Since $x$ has exactly three divisors in total, the only possibility is $a = b$, and $a$ is the unique divisor strictly between $1$ and $x$. If $a$ were composite, it would have a divisor $c$ with $1 < c < a$, which would be a fourth divisor of $x$. Therefore $a$ is prime, and $x = a^2$.

The algorithm sieves the primes up to $10^6$, since $\sqrt{10^{12}} = 10^6$. For each value, it takes the integer square root $r$, checks $r \ast r = x$, and checks that $r$ is prime.

**Correctness.** The two directions of the classification show that the test "$x$ is a perfect square and its root is prime" is equivalent to "$x$ has exactly three divisors". The sieve marks exactly the primes up to $10^6$, and the integer square root is correct for $x \le 10^{12}$ because $10^6$ is the largest possible root.

**Complexity.** The sieve is $O(10^6 \log \log 10^6)$ time and $O(10^6)$ space. Each query is $O(1)$ after the sieve, for $O(10^6 \log \log 10^6 + n)$ total time.

**Common wrong approach.** Checking only that the square root is an integer, which accepts $16 = 4^2$ even though $4$ is not prime. Checking only that the square root is prime, which accepts $7$ even though $7$ has two divisors. Using floating-point `sqrt` without an adjustment, which can return a value one below the true root for values near $10^{12}$.

### Problem 3: Odd Selection

**Restatement.** Given $n$ integers and a target count $x$, decide whether exactly $x$ of the values can be chosen so that their sum is odd. There are up to $t \le 100$ test cases, and $1 \le x \le n \le 1000$.

**Naive baseline.** Enumerate every subset of size $x$ and check its sum. The number of subsets is $\binom{n}{x}$, which is exponential in $n$ for $x$ near $n/2$.

**Insight.** The parity of a sum depends only on the number of odd terms that were chosen, not on which odd terms they are. If the array contains $o$ odd values and $e$ even values, a valid selection uses an odd number $j$ of odd values, at most $o$, and $x - j$ even values, at most $e$.

**Derivation.** Loop over the possible odd counts: $j = 1, 3, 5, \ldots, o$. For each, check $0 \le x - j \le e$. If any $j$ passes, the answer is yes. The condition can also be written as an interval: the odd $j$ must satisfy

$$
\max(1, x - e) \le j \le \min(x, o).
$$

**Correctness.** If a valid selection exists, it uses some number $j$ of odd values. The sum of $j$ odd numbers is odd exactly when $j$ is odd, and the even values do not change the parity. The selection also satisfies $j \le o$ and $x - j \le e$, so the loop finds it. Conversely, if the loop finds a $j$, choose any $j$ of the $o$ odd values and any $x - j$ of the $e$ even values. The choices are possible because the counts suffice, and the sum is odd because $j$ is odd.

**Complexity.** Counting the odds and evens is $O(n)$ per test case, and the loop over odd counts is $O(n)$, for $O(n)$ time and $O(1)$ auxiliary space.

**Common wrong approach.** Requiring at least one odd value but not checking both that the number of chosen odds is odd and that the remaining slots can be filled with evens. For $n = 4$ and $x = 4$ with two odds and two evens, choosing one odd leaves three slots but only two evens, and choosing three odds is impossible, so no selection works; a rule that stops at "there is an odd value" accepts it. Another error is to assume that taking the largest values is optimal, which ignores parity. A third is to test only the smallest possible odd count, which fails when the smallest count leaves too few slots for the evens.

## Practice progression

1. **Recognition.** For each claim, write its quantifier and its domain. "Every $n$" and "these twenty values" are different claims, and the difference decides whether a check can finish the job.
2. **Direct application.** Prove the sum of the first $n$ odd numbers by direct summation, then by pairing the terms. Check both proofs at $n = 5$.
3. **Induction.** Prove the identity by induction, then prove the sum of the first $n$ cubes by induction. Identify the base case and the inductive hypothesis in each.
4. **Adaptation.** Prove that a greedy interval-scheduling rule is safe with an exchange argument. State what is exchanged and why the exchange does not decrease the number of intervals.
5. **Combination.** Take a loop you wrote recently, write its invariant and its variant, and prove that the exit condition plus the invariant gives the answer. Then prove termination.
6. **Challenge.** Find the smallest counterexample to the claim that $n^2 + n + 41$ is always prime, then repair the claim to a true statement about a finite range.
7. **Transfer.** Take a solved problem and write the three-line proof that the solution is correct. If the proof cannot be written in three lines, the solution probably has a case that the code does not handle.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four questions that a proof answers, and which one decides whether a finite check could have sufficed? (At a glance)
2. Why does a single counterexample refute a universal claim, and why does a million confirmations fail to prove one? (Naive approach)
3. State the induction principle and identify the base case, the inductive hypothesis, and the inductive step in the odd-number proof. (Formal model)
4. What does the direct proof use besides algebra, and how is the auxiliary lemma proved? (Correctness proof)
5. Describe the partition that the picture proof uses, and compute the size of layer $k$. (Correctness proof)
6. Why is the checker's loop deliberately linear when the identity gives an $O(1)$ formula? (Algorithm derivation)
7. What is the loop invariant of the reference program, and what is its variant? (Correctness proof)
8. Give a claim with a valid inductive step and a false base case, and name its smallest counterexample. (Common mistakes)
9. At what value of $n$ does a 32-bit square overflow, and why does that produce a false `DIFFER`? (Complexity analysis)
10. When is exhaustive enumeration a proof, and when is it only a test? (Algorithm selection)

## Further reading

- The method for stating and proving a loop invariant, including initialization, preservation, and termination, is in [loop invariants](/algorithms/foundations/loop-invariants).
- The growth-rate notation used to count the checker's work, and the cost model behind the count, is in [complexity analysis](/algorithms/foundations/complexity).
- The call-stack limits that decide whether the recursive form of the sum is safe are in [recursion](/algorithms/foundations/recursion).
- The exchange argument for greedy choices is worked out for intervals in [interval scheduling](/algorithms/greedy/interval-scheduling).
- The counting argument behind double counting is developed with [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The primes up to $10^6$ used by the T-prime classification are built in [sieve of Eratosthenes](/algorithms/number-theory/sieve).
- The academy's treatment of direct proof, induction, contradiction, and the pigeonhole principle is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The enumeration that is a legitimate proof when the domain is finite is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
