---
id: dynamic-programming.convex-hull-trick
title: Convex hull trick
summary: Keep the lower envelope of a set of lines in a stack, so that the smallest value at a point is found in constant amortized time per added line and per query.
division: [platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        convex hull trick,
        cht,
        lines,
        lower envelope,
        monotonic hull,
        slope trick,
        dynamic programming optimization,
    ]
prerequisites:
    required: [foundations.complexity, start.data-structures]
    recommended: [graphs.bfs, trees.lca]
complexity:
    time: "O(n + q) amortized"
    space: "O(n)"
assumptions:
    - Lines are added with non-decreasing slope.
    - Queries arrive with non-decreasing x.
implementations: dynamic-programming.convex-hull-trick
visualization: dynamic-programming.convex-hull-trick
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="dynamic-programming.convex-hull-trick" />

The convex hull trick turns a quadratic dynamic program into a linear one. The dynamic program has the form

$$
\text{dp}[i] \;=\; \min_{j < i} \bigl(\text{dp}[j] + m_j x_i + c_j\bigr),
$$

where each earlier position $j$ contributes a **line** in $x_i$ with slope $m_j$ and intercept $c_j$. The answer at $i$ is the smallest value of the lines added so far, evaluated at $x_i$.

When the slopes arrive in non-decreasing order and the queries arrive in non-decreasing order, the set of lines that can ever be the minimum forms a chain, and the chain can be kept in a stack. Adding a line pops the lines it makes redundant. A query pops the lines it walks past. Every line is pushed once and popped at most once, so $n$ lines and $q$ queries cost $O(n + q)$ in total.

The whole technique is the observation that the lower envelope of a set of lines is made of a few of those lines, and that the few can be maintained by a stack.

## Problem motivation

A courier has to visit $n$ checkpoints along a road, in order. At checkpoint $j$ the courier's vehicle costs $m_j$ per kilometer and there is a fixed departure fee $b_j$. The cost of traveling from checkpoint $j$ to checkpoint $i$ is therefore

$$
m_j (x_i - x_j) + b_j,
$$

where $x_j$ is the distance of checkpoint $j$ from the start.

The courier wants the cheapest way to reach the last checkpoint. The constraints are what make the problem interesting.

- $1 \le n \le 200\,000$ checkpoints, with $x_1 < x_2 < \cdots < x_n$.
- The per-kilometer costs are non-decreasing: $m_1 \le m_2 \le \cdots \le m_n$.
- The values $m_j$, $b_j$ and $x_j$ are as large as $10^9$.

Let $\text{dp}[i]$ be the cheapest cost of reaching checkpoint $i$. Then

$$
\text{dp}[i] \;=\; \min_{j < i} \bigl(\text{dp}[j] + m_j(x_i - x_j) + b_j\bigr).
$$

The direct evaluation is $O(n^2)$, which is $4 \cdot 10^{10}$ steps at the stated bound. The problem is exactly the shape that the convex hull trick solves: each candidate $j$ is a line in $x_i$, and the answer is the smallest of them.

The non-decreasing condition on $m_j$ is not decoration. It is what makes the lines arrive in an order that a stack can exploit, and the article says what to do when it does not hold.

## Recognition patterns

The convex hull trick is the right tool when all of the following hold.

- The dynamic program has the form $\text{dp}[i] = \min_{j < i} (f(j) + g(j, i))$ where the transition cost is **linear** in some variable.
- That variable is **monotone** across the steps, so the queries arrive in order.
- The quantity being minimized is **linear** in the variable, so each candidate is a line.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The slopes are not monotone and the queries are not monotone | The monotone hull is ruled out; use a Li Chao tree or an offline divide and conquer |
| The transition cost is quadratic in the variable | Each candidate is a parabola, not a line; the monotone hull does not apply |
| The dynamic program is already linear | The technique buys nothing |
| $n \le 1000$ | The quadratic dynamic program is fast enough |
| The values exceed $10^{18}$ | The switch points overflow; the integer cross-multiplication test is needed |
| The quantity is maximized rather than minimized | The same technique with the upper envelope |

The phrases in a statement that signal this technique are "the cost of moving from $i$ to $j$ is $a_i \cdot (x_j - x_i) + b_i$", and any statement whose transition cost is a product of a per-item coefficient and a distance.

<Synonyms terms="CHT, convex hull trick, line container, dynamic lower hull" />

## Naive approach

The baseline is the quadratic dynamic program, with the transition written out.

```cpp
for (int i = 1; i <= n; ++i) {
    dp[i] = INFINITY;
    for (int j = 1; j < i; ++j) {
        dp[i] = min(dp[i], dp[j] + m[j] * (x[i] - x[j]) + b[j]);
    }
}
```

This is $O(n^2)$ and it is correct. It is also the reference implementation for the differential test, and it is worth writing first, because the answer it produces is what the optimized version has to reproduce.

The second baseline is to compute the answer of the quadratic program for each $i$ independently, which is the same thing written differently.

## Key insight

The insight is that the smallest value of a set of lines at a point is always attained by one of the lines of the **lower envelope**, and that the envelope of a set of lines with increasing slopes is a chain.

**The switch point.** Two lines with $m_1 < m_2$ cross at the point

$$
x^*_{12} \;=\; \frac{b_1 - b_2}{m_2 - m_1},
$$

and the line with the larger slope is the smaller one for every $x < x^_$ and the larger one for every $x > x^_$.

**The redundancy test.** Take three lines with $m_1 < m_2 < m_3$. The middle line $L_2$ is smaller than $L_1$ exactly when $x < x^*_{12}$, and smaller than $L_3$ exactly when $x > x^*_{23}$. So $L_2$ is the smallest of the three somewhere exactly when there is an $x$ with $x^*_{23} < x < x^*_{12}$, which happens exactly when $x^*_{12} > x^*_{23}$.

Therefore:

<MathPanel type="definition" title="Definition">
The middle line of three lines with strictly increasing slopes is
**redundant** if and only if its switch point with the lower line is at
most its switch point with the upper line:
$x^*_{12} \le x^*_{23}$.
</MathPanel>

**The chain.** The lines that survive the redundancy test form a stack whose switch points strictly decrease as the stack grows. The line on top of the stack has the largest slope, and it is the smallest line for the smallest $x$.

**The query.** As $x$ grows, the smallest line moves down the stack. A line with a larger slope that is beaten by the line below it at the current $x$ is beaten by it at every larger $x$ as well, because the difference between two lines grows with $x$. So it can be popped for good.

That is the whole technique: a redundancy test that pops lines when they are added, and a comparison that pops lines when they are queried.

## Visual intuition

Draw each line and shade the region below it. The **lower envelope** is the boundary of the intersection of all the shaded regions: the staircase of the lowest line at every $x$.

The envelope of three lines is made of at most three segments, and of the middle line only if it appears at all. A line that never appears on the envelope is redundant, and removing it changes nothing about any query.

With increasing slopes, the envelope is read from right to left: the largest slope is the smallest line for the smallest $x$, and the smallest slope is the smallest line for the largest $x$. The lines of the envelope, in that order, are exactly the lines of the stack from the top down.

Adding a line with a larger slope extends the envelope to the left and can erase the segments of the lines it dominates. A query at a larger $x$ walks the envelope to the right and erases the segments it has passed.

The laboratory below draws the lines, the envelope, and the stack beside them, and shows the pop that each operation performs.

<AlgorithmPlayer algorithm="dynamic-programming.convex-hull-trick" />

## Formal model

Let the lines be $L_j(x) = m_j x + b_j$.

<MathPanel type="definition" title="Definition">
The **switch point** of two lines with $m_1 < m_2$ is
$x^*_{12} = (b_1 - b_2)/(m_2 - m_1)$. For $x < x^*_{12}$ the line with the
larger slope is the smaller one, and for $x > x^*_{12}$ the line with the
smaller slope is the smaller one.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **lower envelope** of a set of lines is the function
$E(x) = \min_j L_j(x)$. A line is **on the envelope** if it attains $E(x)$
for some $x$, and **redundant** if it does not.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $L_1, L_2, L_3$ have strictly increasing slopes. Then $L_2$ is
redundant if and only if $x^*_{12} \le x^*_{23}$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $L_1$ and $L_2$ have slopes $m_1 < m_2$, and suppose
$L_1(x) < L_2(x)$ at some point $x$. Then $L_1(x') < L_2(x')$ for every
$x' > x$.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let the stack hold the lines of the envelope from the bottom up, in
increasing order of slope, and let $x^*_i$ be the switch point of the
$i$-th and the $(i+1)$-th lines of the stack. Then
$x^*_1 > x^*_2 > \cdots$, that is, the switch points strictly decrease as
the stack grows.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **monotone** convex hull trick is one in which the lines are added with
non-decreasing slopes and the queries are made at non-decreasing values
of $x$.
</MathPanel>

## Algorithm derivation

The state is the stack of lines, each held as a slope and an intercept.

The add rule. When a line $L$ with slope $m$ arrives:

1. If the top of the stack has the same slope $m$, then only one of the two can be useful. If the top has the smaller or equal intercept, the new line is never the smallest and is dropped. Otherwise the top is popped, because the new line beats it everywhere.
2. While the stack has at least two lines and the top line is redundant with respect to the second-from-top and the new line, pop the top.
3. Push the new line.

The add rule is correct because every popped line is redundant: it is never the smallest of the three lines involved, so removing it changes no query. And the equal-slope rule is correct because two lines with the same slope are ordered by their intercepts everywhere.

The query rule, at the point $x$:

1. While the stack has at least two lines and the second-from-top line is strictly smaller than the top line at $x$, pop the top.
2. The answer is the value of the top line at $x$.

The query rule is correct by the second lemma: a top line that is beaten at $x$ is beaten at every larger $x$, so once the queries are known to be non-decreasing, popping it loses nothing.

<MathPanel type="invariant" title="Invariant">
After every add, the stack holds exactly the lines of the lower envelope
of the lines added so far, in increasing order of slope from the bottom,
and the switch points of the stack strictly decrease as the stack grows.
After every query, the popped lines are below the envelope of the
remaining lines for every larger $x$, so they can never be the answer to
a later query.
</MathPanel>

## Step-by-step execution

Use the lines from the reference implementation: $L_1(x) = x$, $L_2(x) = 2x - 1$, and $L_3(x) = 3x - 3$, added in that order, and then $L_4(x) = 4x - 20$.

1. **Add $L_1$.** The stack is empty, so nothing is popped. The stack holds $[L_1]$.
2. **Add $L_2$.** The slope $2$ is larger than $1$, so the equal-slope rule does not apply. The stack has one line, so the redundancy test needs three and does not apply. The stack holds $[L_1, L_2]$.
3. **Add $L_3$.** The three lines are $L_1, L_2, L_3$. The switch points are $x^*_{12} = (0 - (-1))/(2 - 1) = 1$ and $x^*_{23} = (-1 - (-3))/(3 - 2) = 2$. Since $1 \le 2$, the middle line $L_2$ is redundant, and it is popped. The stack now holds $[L_1]$, which is too short for another test, so $L_3$ is pushed. The stack holds $[L_1, L_3]$.
4. **Query $x = 0$.** The top $L_3$ is worth $-3$ and the line below it $L_1$ is worth $0$. The line below is not smaller, so nothing is popped. The answer is $-3$, which is $\min(0, -1, -3)$.
5. **Query $x = 1$.** The top $L_3$ is worth $0$ and $L_1$ is worth $1$. Nothing is popped. The answer is $0$, which is $\min(1, 1, 0)$.
6. **Query $x = 2$.** The top $L_3$ is worth $3$ and $L_1$ is worth $2$. The line below is smaller, so $L_3$ is popped. The stack holds $[L_1]$ and the answer is $2$, which is $\min(2, 3, 3)$.
7. **Add $L_4$.** The slope $4$ is larger than $1$ and the stack has one line, so $L_4$ is pushed. The stack holds $[L_1, L_4]$.
8. **Query $x = 3$.** The top $L_4$ is worth $-8$ and $L_1$ is worth $3$. Nothing is popped. The answer is $-8$, which is $\min(3, 5, 6, -8)$.
9. **Add $L_4' = 4x - 30$.** The slope equals the slope of the top, and the top has the intercept $-20$, which is larger than $-30$, so the top is popped and the new line wins against it. The stack holds $[L_1, L_4']$ and the answer at $x = 3$ is $12 - 30 = -18$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
The stack always holds the lines of the lower envelope of the lines added
so far, and every query returns the smallest value of those lines at the
queried point.
</MathPanel>

<MathPanel type="proof" title="Proof">
First the redundancy lemma. Let $L_1, L_2, L_3$ have strictly increasing
slopes. Because $m_1 < m_2$, the difference $L_2(x) - L_1(x)$ is
decreasing in $x$, and it vanishes at $x^*_{12}$, so
$L_2(x) < L_1(x)$ exactly when $x < x^*_{12}$. Similarly, because
$m_2 < m_3$, $L_2(x) < L_3(x)$ exactly when $x > x^*_{23}$. The line
$L_2$ is therefore the smallest of the three exactly when
$x^*_{23} < x < x^*_{12}$, which is a nonempty interval exactly when
$x^*_{12} > x^*_{23}$. So $L_2$ is redundant exactly when
$x^*_{12} \le x^*_{23}$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The add operation preserves the envelope. A line that the redundancy test
removes is redundant among the three lines involved, so it is not on the
envelope of that set, and a fortiori not on the envelope of the whole
set. Removing it therefore leaves the envelope of the whole set unchanged.
The equal-slope rule removes a line that is dominated everywhere by
another line with the same slope and a smaller intercept, so again the
envelope is unchanged. The new line is then pushed, and the envelope of
the enlarged set is the envelope of the old set with the new line added,
which is exactly what the stack now describes.
</MathPanel>

<MathPanel type="proof" title="Proof">
The query operation returns the smallest value. The query rule pops the
top line only when the line below it is strictly smaller at the current
$x$. By the second lemma, the line below stays smaller at every larger
$x$, so the popped line cannot be the answer to any later query. Because
the queries are non-decreasing, the popped lines are irrelevant from then
on. When the loop stops, the top line is smaller than the line below it,
and the switch points of the stack strictly decrease, so the top line is
smaller than every other line of the stack at $x$. Since the stack
describes the envelope, it is the smallest of all the lines added so far.
</MathPanel>

## Complexity analysis

**Each line is pushed once and popped at most once.** A line can be popped by an add, by a query, or by neither, but it is never pushed twice.

**Therefore $n$ adds and $q$ queries cost $O(n + q)$ in total.** The amortized cost per operation is $O(1)$, even though a single operation may pop many lines.

**Space: $O(n)$** for the stack of slopes and intercepts.

<MathPanel type="complexity" title="Complexity">
Monotone convex hull trick with $n$ lines and $q$ queries: $O(n + q)$
amortized time in total, $O(1)$ amortized time per operation, and $O(n)$
extra space.
</MathPanel>

The amortized bound is the whole point. A single query may pop $n$ lines, and a single add may pop $n$ lines, but the total number of pops over the whole run is at most $n$, so the average is constant.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Monotone slopes and monotone queries | The monotone convex hull trick, $O(1)$ amortized per operation |
| Monotone slopes and arbitrary queries | The same hull with a binary search over it, $O(\log n)$ per query |
| Arbitrary slopes and arbitrary queries | A Li Chao tree, $O(\log n)$ per operation |
| Arbitrary slopes and offline queries | A divide and conquer on the queries, $O(n \log n)$ in total |
| The maximum rather than the minimum | The same technique with the upper envelope |
| The transition cost is quadratic | A different optimization, such as a monotone queue |
| The convex hull of a set of points | Andrew's monotone chain, which is the same geometry |

The second and third rows are the fallbacks. The monotone hull relies on the queries being non-decreasing, and when they are not, the same stack can still be used with a binary search for the switch point: the lines stay ordered, and the query finds the right one in $O(\log n)$.

## Reference implementations

<CodeViewer algorithm="dynamic-programming.convex-hull-trick" />

The manifest publishes two variants. The `minimal` variant is a reusable class with an `add` for a line and a `query` for a point, and it performs no input and output. The `program` variant reads `n q`, then $n$ lines `m b` that add the line $y = mx + b$, then $q$ points `x` that ask for the smallest value, and prints one answer per line.

The program variant reads all the lines before all the queries, which matches the monotone formulation: the lines of the dynamic program are generated one at a time as the states are computed, and each one is immediately used as a query.

## Recursion decision

The hull is a stack, and both operations are loops. There is nothing to recurse over.

The one recursive formulation that is instructive is the redundancy test written as a fold over the stack, but it is not better. Each push and each pop would become a function call, and the call overhead would dominate arithmetic that is already only a few operations. The reference implementations use two vectors and a loop, and the recursion is only mentioned here because it makes the shape of the data structure obvious.

| Language | Cost of one stack operation | Recommendation |
| --- | --- | --- |
| C and C++ | A few nanoseconds | Use the vectors; the loop is optimal |
| Java | A few nanoseconds after the JIT warms up | Use the vectors |
| Python | About a microsecond per operation | Use the vectors; the arithmetic dominates |
| Pascal | A few nanoseconds | Use the arrays |
| JavaScript | A few nanoseconds after the JIT warms up | Use the arrays; watch the precision |

## Implementation walkthrough

The first decision is the precision of the redundancy test. The textbook test multiplies:

$$
(b_1 - b_2)(m_3 - m_2) \;\le\; (b_2 - b_3)(m_2 - m_1),
$$

which is exact, but the products of the coefficients can be far larger than a 64-bit integer when the coefficients themselves are of order $10^9$. The reference implementation divides instead:

```cpp
return static_cast<double>(b1 - b2) / static_cast<double>(m2 - m1) <=
       static_cast<double>(b2 - b3) / static_cast<double>(m3 - m2);
```

The comparison is then made on the switch points themselves, and the differences of the coefficients have to fit in 64 bits. The trade is deliberate: a division loses a bit of exactness at the boundary, and a multiplication loses the whole program to an overflow.

The second decision is the equal-slope rule. Two lines with the same slope are ordered by their intercepts, so only one of them can ever be the minimum:

```cpp
while (!slope_.empty() && slope_.back() == m) {
    if (intercept_.back() <= b) {
        return true;              // the new line is never the smallest
    }
    slope_.pop_back();            // the new line wins everywhere
    intercept_.pop_back();
}
```

The second decision is the width of the evaluation. The answer is $m \cdot x + b$, and with $m$ and $x$ of order $10^9$ the product is of order $10^{18}$, which is inside a signed 64-bit integer but well outside a 32-bit one. The reference implementations use a 64-bit type, and the JavaScript variant notes that a plain number loses the low bits beyond $2^{53}$.

The third decision is the order of the two tests in the query. The stack is compared from the top down, and the loop stops at the first line that is not beaten by the line below it:

```cpp
while (slope_.size() >= 2) {
    const long long top = slope_.back() * x + intercept_.back();
    const long long below = slope_[slope_.size() - 2] * x + intercept_[slope_.size() - 2];
    if (below >= top) {
        break;
    }
    slope_.pop_back();
    intercept_.pop_back();
}
```

The comparison is `below >= top` and not `below > top`, so a tie keeps the line with the larger slope. The answer is the same either way, and the tie is broken in the same direction every time, which is what keeps the output of the six language versions identical.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Popping the top of the query loop unconditionally | A line that is still needed is lost | Pop only when the line below is smaller |
| Using the strict inequality the other way round in the redundancy test | Every line is kept, and the stack grows without bound | Remember that the middle line is redundant when $x^*_{12} \le x^*_{23}$ |
| Multiplying the coefficients in the redundancy test | The products overflow and the test is wrong | Divide, and check that the differences fit in 64 bits |
| Adding the lines in an order that does not match the slopes | The stack invariant breaks and the answers are wrong | Sort the lines by slope, or generate them in order |
| Answering the queries in an order that does not match the $x$ values | A popped line is needed again | Sort the queries by $x$, or use a Li Chao tree |
| Forgetting the equal-slope case | A duplicate slope makes the switch point undefined | Handle the equal slope before the redundancy test |
| Using a 32-bit evaluation of $m \cdot x$ | The answer overflows | Use a 64-bit type |
| Computing the minimum over the whole stack at every query | The query becomes $O(n)$ | Pop the lines the query walks past |

### Why this fails: the query that goes backwards

The mistake that survives review most often is assuming that the monotonicity of the queries is a convenience rather than a requirement.

Take two lines, $L_1(x) = 0$ and $L_2(x) = x - 1$, and ask for the minimum at $x = 5$ and then at $x = 0$.

1. Adding $L_1$ gives the stack $[L_1]$. Adding $L_2$ gives the stack $[L_1, L_2]$, because the slopes $0$ and $1$ differ and the stack is too short for the redundancy test.
2. The query at $x = 5$ finds the top $L_2$ worth $4$ and the line below $L_1$ worth $0$. The line below is strictly smaller, so $L_2$ is popped. The answer is $0$, which is correct: the minimum of $0$ and $4$ is $0$.
3. The query at $x = 0$ finds only $L_1$ on the stack and answers $0$.

The correct answer to the second query is $\min(0, -1) = -1$. The program prints $0$, because it destroyed $L_2$ at the first query, and $L_2$ is smaller than $L_1$ for every $x < 1$.

Two lines and two queries is the smallest counterexample there is. The pop at $x = 5$ was justified by the claim "the line below has the smaller slope, so it stays smaller for every larger $x$", and that claim is false for $x = 0$.

The generalization is a condition on the whole technique: **a query may only pop a line when every later query is at a larger $x$.** The moment the queries go backwards, a popped line can become the answer again, and the stack has to be searched instead of walked. The structure that answers arbitrary queries is a Li Chao tree, which stores the lines in a balanced binary tree indexed by the ranges on which they are the minimum.

There is a second failure with the same root, and this one is about the lines rather than the queries: the slope order. Take the lines $L_1(x) = 2x$ and $L_2(x) = x + 10$, added in that order, so the slopes decrease, and query $x = 0$ and then $x = 20$.

1. The stack holds $[L_1, L_2]$, but its slopes decrease, so the invariant that the top has the largest slope is broken.
2. The query at $x = 0$ finds the top $L_2$ worth $10$ and the line below $L_1$ worth $0$. The line below is smaller, so $L_2$ is popped. But $L_2$ has the _smaller_ slope, so it wins for every larger $x$, and the pop was unjustified.
3. The query at $x = 20$ answers $40$, while the correct minimum is $\min(40, 30) = 30$.

The generalization is the other half of the same condition: **the lines must arrive in non-decreasing order of slope.** Both monotonicities are needed, and the structure that survives losing either of them is the Li Chao tree.

## Variants and extensions

- **The upper envelope.** Negate the slopes and the intercepts, and the minimum becomes the maximum.
- **Arbitrary queries.** Keep the monotone hull and binary search over the switch points, at $O(\log n)$ per query.
- **Arbitrary slopes.** The Li Chao tree, which stores a line at every node of a binary tree over the query coordinates.
- **The offline divide and conquer.** When the slopes are not monotone but the queries are known in advance, the queries are divided by their index, and each half is solved with a hull built from the other half.
- **The maximum of a subarray with a penalty.** The same structure, used to find the penalty at which the optimum changes, which is the Lagrangian relaxation of a cardinality constraint.
- **The slope trick.** The convex hull trick and the slope trick are two faces of the same idea, one for lines and one for piecewise linear functions.
- **The convex hull of points.** The same geometry, computed with Andrew's monotone chain instead of with a stack of lines.
- **Weighted variants.** When each line has a weight and the objective is a weighted sum, the hull becomes a segment tree of hulls.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each of them is avoidable with a fixed procedure.

1. Write the dynamic program out in full, in $O(n^2)$ form, and get it right. The optimized version is a change to one line of it.
2. Rewrite the transition as a line, and check that the coefficient of the query variable is exactly the slope and that the rest is the intercept.
3. Check the two monotonicities explicitly: the slopes in the order the lines are added, and the query points in the order they are asked. If either fails, sort or switch to a Li Chao tree.
4. Handle the equal-slope case before the redundancy test.
5. Check the width of the evaluation, and of the differences used in the redundancy test.
6. Compare against the quadratic version on random small inputs. A disagreement is a counterexample worth more than an hour of reading.

## Worked problems

### Problem 1: the cheapest route

**Restatement.** There are $n$ checkpoints at increasing positions $x_1 < \cdots < x_n$. Leaving checkpoint $j$ costs a fee $b_j$ and $costs $m_j$ per unit of distance, with $m_1 \le \cdots \le m_n$. Find the cheapest cost of reaching checkpoint $n$. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** The quadratic dynamic program, at a cost of $O(n^2)$.

**Insight.** The transition $\text{dp}[i] = \min_{j<i}(\text{dp}[j] + m_j(x_i - x_j) + b_j)$ is the minimum of the lines $L_j(x) = m_j x + (\text{dp}[j] + b_j - m_j x_j)$ at $x = x_i$.

**Derivation.** Process the checkpoints in order. When checkpoint $j$ is reached, add the line with slope $m_j$ and intercept $\text{dp}[j] + b_j - m_j x_j$. When checkpoint $i$ is reached, query the hull at $x_i$ and that is $\text{dp}[i]$.

**Correctness.** The hull holds the envelope of the lines of all earlier checkpoints, so the query returns the minimum over all $j < i$, which is the recurrence.

**Complexity.** $O(n)$ amortized time and $O(n)$ space.

**Common wrong approach.** Adding the line of checkpoint $i$ before querying, which lets a checkpoint reach itself.

### Problem 2: the largest total profit

**Restatement.** A trader may stop at any of $n$ stations along a road and sell the goods carried there. The price at station $i$ is $p_i$, and carrying the goods from station $j$ to station $i$ costs $c_j (x_i - x_j)$, with $c_1 \le \cdots \le c_n$. Find the largest profit. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** The quadratic dynamic program over the stations.

**Insight.** The transition has the same linear shape, and the maximum is the upper envelope, which is the same structure with the signs flipped.

**Derivation.** Keep the best profit so far as $\text{dp}[j]$. The profit of selling at $i$ after buying at $j$ is $\text{dp}[j] - c_j(x_i - x_j)$, which is the line $L_j(x) = -c_j x + (\text{dp}[j] + c_j x_j)$ evaluated at $x_i$. Add the line of station $j$ when $j$ is processed, and query the hull at $x_i$.

**Correctness.** The same envelope argument, with the maximum in place of the minimum.

**Complexity.** $O(n)$ amortized time and $O(n)$ space.

**Common wrong approach.** Using the minimum structure without negating the coefficients, which computes the smallest loss rather than the largest profit.

### Problem 3: the per-kilometer costs are not sorted

**Restatement.** The same checkpoint problem, but the $m_j$ are in arbitrary order. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** The quadratic dynamic program.

**Insight.** The monotone hull does not apply, because the lines no longer arrive in order of slope. Two structures remain.

**Derivation, first way.** Use a Li Chao tree. It stores a line at every node of a binary tree over the query coordinates, and each insertion and each query costs $O(\log n)$. The implementation is longer than the stack, and it is the standard answer.

**Derivation, second way.** Use an offline divide and conquer. The queries are split by their index into a left half and a right half; the lines contributed by the left half are added in slope order and used to answer the right half, and the lines contributed by the right half are added in slope order and used to answer the left half. The recursion gives $O(n \log n)$ in total.

**Correctness.** Both structures maintain the envelope of exactly the lines that may answer the query, so the returned minimum is the minimum over all the candidates.

**Complexity.** $O(n \log n)$ time and $O(n)$ space for both.

**Common wrong approach.** Sorting the checkpoints by cost and running the monotone hull, which changes the order in which the checkpoints are visited and therefore changes the answer.

## Practice progression

1. **Recognition.** Given a statement, decide whether the convex hull trick applies. Look for a transition cost that is linear in a monotone variable.
2. **Direct application.** Write the quadratic dynamic program, then rewrite it as a hull, and compare the two on random inputs.
3. **Adaptation.** Turn the minimum into a maximum, and handle the case where two lines have the same slope.
4. **Combination.** Add the change-of-root technique, and use the hull to answer the queries of a problem where the states are themselves hull queries.
5. **Challenge.** Solve the version where the slopes are not monotone, with a Li Chao tree, and then with an offline divide and conquer.
6. **Transfer.** Use the same idea for a different shape: the convex hull of a set of points, which is the same geometry with the roles of the coordinates exchanged, and the slope trick, which is the same idea for piecewise linear functions.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the stack hold, and in what order? (Formal model)
2. State the redundancy test, and explain why the middle line of three is redundant exactly under that condition. (Key insight)
3. Why may a query pop the line on top of the stack? (Correctness proof)
4. What are the two monotonicity requirements, and what happens when each of them is violated? (Why this fails)
5. Why does the equal-slope case need its own rule? (Implementation walkthrough)
6. Why does the reference implementation divide rather than multiply in the redundancy test? (Implementation walkthrough)
7. What is the total cost of $n$ adds and $q$ queries, and why is it amortized? (Complexity analysis)
8. Give the smallest example in which a query that goes backwards gives a wrong answer. (Why this fails)
9. When is a Li Chao tree the right tool instead? (Algorithm selection)
10. How is the answer of the dynamic program recovered from the hull? (Worked problems)

## Further reading

- The technique that answers a range sum in constant time when nothing changes, and the reason a hull cannot be maintained the same way, are covered by [prefix sums](/algorithms/arrays/prefix-sums).
- The static structure that answers range queries in constant time is the [sparse table](/algorithms/range-queries/sparse-table), and the dynamic one is the [segment tree](/algorithms/range-queries/segment-tree).
- The dynamic program that the hull optimizes has the shape of the recurrences in [tree dynamic programming](/algorithms/trees/tree-dp).
- The ancestor table used by one of the harder variants of this technique is in [lowest common ancestor](/algorithms/trees/lca).
- The classical geometry of the same objects, the convex hull of a set of points, is the same idea with the roles of the coordinates exchanged, and it is computed with a monotone chain rather than with a stack of lines.
- Every listing in this article, in all six languages, is published in the reference implementations of this repository, in six languages each.
