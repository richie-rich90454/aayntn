---
id: searching.ternary-search
title: Ternary search
summary: Find the maximum of a unimodal function by discarding a third of the interval at every step, and understand why contest problems almost never need it.
division: [silver, gold]
subjects: [searching]
level: intermediate
importance: specialized-technique
keywords: [ternary search, unimodal function, hill climbing, peak finding, precision]
prerequisites:
    required: [foundations.complexity]
    recommended: [searching.binary-search]
complexity:
    time: "O(log_{3/2}(L / varepsilon)) iterations, each costing two evaluations"
    space: "O(1)"
assumptions:
    - The function is unimodal on the search interval, increasing up to one peak and decreasing after it.
    - The function can be evaluated at any point of the interval.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Locate the maximum of a unimodal function on an interval |
| **Time** | $O(\log_{3/2}(L / \varepsilon))$ iterations, each costing two evaluations |
| **Auxiliary space** | $O(1)$ |
| **Requires** | A function that rises to one peak and falls afterwards |
| **Fails when** | The function has two humps, or a plateau hides the peak |
| **Primary technique** | Two probes inside the interval, and the removal of the third that cannot hold the peak |
| **Sibling article** | The halving over a monotone predicate is in [binary search](/algorithms/searching/binary-search) |

Ternary search is the shape of the search you make when you can only see one step ahead of you: stand at a point, look left and right, and walk toward the side that is higher. If the landscape rises to one peak and falls afterwards, that walk reaches the peak, and it does so by throwing away a third of the distance each time.

Contest problems rarely give you a landscape. They give you data and a question, and the useful searches over data are monotone rather than unimodal, which is what binary search exploits. Ternary search is worth knowing because it is the natural generalization of binary search, and because knowing why it is not used saves a great deal of wasted time.

## Problem motivation

A drone measures the height of the ground along a straight line. The terrain is known to be a single hill: it rises to one summit and then falls. The drone must find the highest point, and it can only report its height to the nearest centimeter.

The constraints:

- The terrain is described by a function $f$ that can be evaluated at any real point of the interval $[0, 100]$.
- $f$ is unimodal: there is a point $p$ such that $f$ is increasing on $[0, p]$ and decreasing on $[p, 100]$.
- The answer must be accurate to within $10^{-6}$.

The naive approach samples the interval on a grid of $10^8$ points, which is $10^8$ evaluations, and the grid has to be finer than the tolerance.

The binary search approach compares $f(m)$ with $f(m + \varepsilon)$ and follows the slope, which halves the interval at every step. It needs about $27$ iterations for this tolerance, at two evaluations each, so about $53$ evaluations.

The ternary search approach probes two interior points and discards a third of the interval at every step. It needs about $45$ iterations, at two evaluations each, so about $90$ evaluations.

The drone problem is the classical home of ternary search, and it is also the reason the technique is not common in contests: the drone is handed a function, and contest problems are not.

## Recognition patterns

Ternary search is the right tool when all of the following hold.

- The quantity being optimized is given by a **function that can be evaluated**, not by an array to be scanned.
- The function is **unimodal** on the interval: it rises to one peak and falls.
- The answer is a **real number** or a position in a continuous range, and a **precision** is required.
- The **peak itself** is wanted, or the value at the peak.

The phrases that signal it are "the terrain is a single hill", "the function is unimodal", "find the maximum to within $10^{-6}$", "hill climbing". The phrases that rule it out are almost all of contest programming: "the maximum element of the array" (a scan), "the smallest value of $x$ such that" (a monotone predicate and a binary search), "the highest mountain" (an array of heights).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| The answer must be exact | A scan is better than any search over a range |
| The answer must be accurate to $\varepsilon$ | The search is the right tool |
| The precision is $10^{-9}$ or finer | The evaluations dominate the cost; the precision costs about 20 more iterations |
| The function is monotone rather than unimodal | Binary search, at one evaluation per step |
| The data is an array | A scan or a monotone search; there is no function to probe |
| The function has a plateau at the top | The discrete version discards the peak; see the counterexample |

The fourth row is the distinction that matters most in practice. Monotone is a much weaker requirement than unimodal, and monotone is what contest problems actually give.

<Synonyms terms="ternary search, unimodal search, hill climbing, peak finding, trinary search" />

## Naive approach

The baseline samples the interval on a grid.

```python
def grid_peak(f, lo, hi, epsilon):
    steps = int((hi - lo) / epsilon) + 1
    best = lo
    for k in range(steps):
        x = lo + k * epsilon
        if f(x) > f(best):
            best = x
    return best
```

This is $O(L / \varepsilon)$ evaluations and it is correct for any function, unimodal or not. It is the reference implementation for the differential test.

The second baseline is the binary search on the slope, which is the technique to reach for when the function is unimodal and the evaluation is expensive.

```python
def slope_peak(f, lo, hi, epsilon):
    while hi - lo > epsilon:
        mid = (lo + hi) / 2
        if f(mid) < f(mid + epsilon):
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2
```

This halves the interval per iteration at two evaluations each, and it needs $\log_2 (L / \varepsilon)$ iterations.

## Key insight

The insight is that **two probes can rule out a third of the interval**.

Let the interval be $[lo, hi]$, and let

$$
m_1 = lo + \left\lfloor \frac{hi - lo}{3} \right\rfloor,
\qquad
m_2 = hi - \left\lfloor \frac{hi - lo}{3} \right\rfloor.
$$

There are three cases.

- If $f(m_1) < f(m_2)$, then the peak lies to the right of $m_1$, so the interval becomes $[m_1 + 1, hi]$ in the discrete version and $[m_1, hi]$ in the continuous one.
- If $f(m_1) > f(m_2)$, then the peak lies to the left of $m_2$, so the interval becomes $[lo, m_2 - 1]$ discretely and $[lo, m_2]$ continuously.
- If $f(m_1) = f(m_2)$, then in the continuous version the peak lies between them, so the interval becomes $[m_1, m_2]$. In the discrete version the equality is a problem, because the two equal values might sit on a plateau below the peak, and the usual rule of discarding the middle third throws the peak away.

Each step removes a third of the interval, so the number of steps needed to reach a tolerance $\varepsilon$ is $\log_{3/2}(L/\varepsilon)$, which is about $1.71 \log_2 (L/\varepsilon)$.

Now compare the cost of the evaluations. Ternary search spends two evaluations per step, so it spends about $3.42 \log_2 (L/\varepsilon)$ evaluations. The slope-based binary search spends two evaluations per step and halves the interval, so it spends $2 \log_2 (L/\varepsilon)$. A binary search over a monotone predicate spends one evaluation per step, so it spends $\log_2 (L/\varepsilon)$.

**Ternary search is the most expensive of the three, by a factor of about three.** The reason it is classically taught anyway is that it is the technique that does not need the slope of the function, only its values, and it is simpler to state than a search that compares $f(m)$ with $f(m+\varepsilon)$.

That is the first reason it is not used in contests. The second is more fundamental: the contest version of a search is a search over a **monotone predicate**, not over a unimodal function, and the monotone version is cheaper and stronger.

## Formal model

Let $f : [lo, hi] \to \mathbb{R}$ be a function on a real interval.

::: math definition Definition
A function $f$ is **unimodal** on $[lo, hi]$ if there is a point $p$ in the
interval such that $f$ is non-decreasing on $[lo, p]$ and non-increasing on
$[p, hi]$. The point $p$ is a **peak**. The function is **weakly unimodal**
if the monotonicity is non-strict, and **strictly unimodal** if it is strict
on both sides.
:::


::: math definition Definition
The **discrete unimodal array** is a sequence $A_1, \dots, A_n$ with an index
$p$ such that $A_1 \le \cdots \le A_p \ge \cdots \ge A_n$.
:::


::: math lemma Lemma
Let $f$ be unimodal on $[lo, hi]$ and let $m_1 < m_2$ be two interior points.
If $f(m_1) < f(m_2)$ then every peak of $f$ lies in $[m_1, hi]$. If
$f(m_1) > f(m_2)$ then every peak of $f$ lies in $[lo, m_2]$. If
$f(m_1) = f(m_2)$ then every peak of $f$ lies in $[m_1, m_2]$.
:::


The lemma is the whole technique. The third case is the one that the discrete version gets wrong, because a discrete sequence can be weakly unimodal with a plateau, and then the equal values need not be at the peak.

::: math invariant Invariant
Throughout the search, the interval still contains a peak of $f$. Every
iteration reduces the interval to about two thirds of its previous length,
so after $k$ iterations the interval has length at most $L \cdot (2/3)^k$.
:::


## Algorithm derivation

The state is the interval $[lo, hi]$ and the target precision $\varepsilon$.

1. While $hi - lo > \varepsilon$:
2. Compute $m_1 = lo + \lfloor (hi - lo)/3 \rfloor$ and $m_2 = hi - \lfloor (hi - lo)/3 \rfloor$.
3. If $f(m_1) < f(m_2)$, set $lo = m_1$. Otherwise if $f(m_1) > f(m_2)$, set $hi = m_2$. Otherwise set $lo = m_1$ and $hi = m_2$.
4. Return the midpoint of $[lo, hi]$.

Step 3 is correct by the lemma: each branch keeps the half of the interval that must contain a peak.

In the discrete version the same loop runs on indices, and the equality branch is the problem. The safe rule for a strictly unimodal array is to keep $[m_1, m_2]$; the common rule, which discards the middle third on equality, is what breaks.

## Step-by-step execution

Take the strictly unimodal array $[1, 3, 5, 4, 2]$ and follow the discrete search for the maximum value.

- $[lo, hi] = [0, 4]$. The length is 4, so $m_1 = 0 + 1 = 1$ and $m_2 = 4 - 1 = 3$. The values are $A_1 = 3$ and $A_3 = 4$, so $A_1 < A_3$.
- The peak lies to the right of $m_1$, so $lo = m_1 + 1 = 2$ and the interval is $[2, 4]$.
- $[lo, hi] = [2, 4]$. The length is 2, so $m_1 = 2 + 0 = 2$ and $m_2 = 4 - 0 = 4$. The values are $A_2 = 5$ and $A_4 = 2$, so $A_2 > A_4$.
- The peak lies to the left of $m_2$, so $hi = m_2 - 1 = 3$ and the interval is $[2, 3]$.
- $[lo, hi] = [2, 3]$. The length is 1, so $m_1 = 2$ and $m_2 = 3$. The values are $A_2 = 5$ and $A_3 = 4$, so $A_2 > A_3$.
- The peak lies to the left of $m_2$, so $hi = m_2 - 1 = 2$ and the interval is $[2, 2]$. The answer is $A_2 = 5$.

Three iterations found the maximum, and every discarded region was proved to lie on the falling side of the peak.

Now take the weakly unimodal array $[1, 4, 4, 1]$, whose peak is a plateau of two equal values. The probes are at indices 1 and 2, both holding 4, so the equality branch fires. The common rule, which discards the middle third, sets $lo = m_1 + 1 = 2$ and $hi = m_2 - 1 = 1$, and the interval is empty. The value 4 is recoverable from the probes, but the peak index is gone and the search has nothing left to report.

## Correctness proof

::: math theorem Theorem
If $f$ is unimodal on $[lo, hi]$, the continuous ternary search returns a point within $\varepsilon$ of a peak, and it terminates.
:::


::: math proof Proof
The invariant states that the interval contains a peak of $f$ and that its
length is at most $L \cdot (2/3)^k$ after $k$ iterations.

The invariant holds initially, because the whole interval contains a peak.

Suppose it holds at the start of an iteration. Let $m_1$ and $m_2$ be the two probes. By the lemma, the peak lies in the half chosen by the comparison of $f(m_1)$ and $f(m_2)$, and the chosen half has length at most $(hi - lo) - \lfloor (hi - lo)/3 \rfloor$, which is at most $(hi - lo) \cdot (2/3) + 1$. So the new interval still contains a peak and its length has shrunk by roughly the factor two thirds.

The length shrinks by a factor of at least one third at every iteration, so after $k$ iterations the length is at most $L \cdot (2/3)^k$. The loop terminates when this is at most $\varepsilon$, which happens for $k \ge \log_{3/2}(L/\varepsilon)$, and the midpoint of the final interval is within $\varepsilon$ of the peak it contains. $\square$
:::


::: math proof Proof
The proof depends on the unimodality assumption and on nothing else. In
particular, it does not depend on the array version, whose equality branch
discards the middle third. The discrete proof fails at exactly that step,
because a weakly unimodal array may have its peak inside the discarded
middle third.
:::


## Complexity analysis

**Time: $O(\log\_{3/2}(L / \varepsilon))$ iterations, each costing two evaluations of $f$.** The number of function calls is therefore about $3.42 \log_2 (L/\varepsilon)$, which is about 91 calls for $L = 100$ and $\varepsilon = 10^{-6}$.

**Auxiliary space: $O(1)$.** The state is the two ends of the interval.

For the discrete version the complexity is $O(\log n)$ iterations, but each iteration performs two array lookups, so the number of lookups is about $2 \log_{3/2} n \approx 3.42 \log_2 n$, which is more than the $n$ lookups of a plain scan for small $n$. A scan is better than a search until the array is large enough for the logarithm to win.

::: math complexity Complexity
Ternary search on a unimodal function: $O(\log_{3/2}(L / \varepsilon))$
iterations and $O(1)$ auxiliary space, with two function evaluations per
iteration. The discrete version: $O(\log n)$ iterations and $O(1)$ space.
:::


## Algorithm selection

| Situation | What to use |
| --- | --- |
| The maximum of a unimodal real function, to a precision | Ternary search |
| The same question, with an expensive evaluation | Binary search on the slope, which uses about half as many evaluations |
| The maximum element of an array | A scan, at $O(n)$ |
| The smallest $x$ such that a condition holds | Binary search over the answer, in [binary search on the answer](/algorithms/searching/binary-search-on-answer) |
| The first index where a predicate holds in a sorted array | Binary search, in [binary search](/algorithms/searching/binary-search) |
| The maximum of every window of an array | A monotone queue, in [monotonic queue](/algorithms/arrays/monotonic-queue) |
| A landscape with two hills | A scan; no unimodal search can be trusted |

The last row is the honest summary. When the shape of the landscape is not guaranteed, the only safe answer is to look at everything.

## Recursion decision

The continuous ternary search has a recursion depth of $O(\log_{3/2}(L/\varepsilon))$, which is about 38 for the drone problem, and that is safe in every language. The discrete version has a depth of $O(\log n)$, about 20 for $n = 10^6$.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursion of depth 40 is fine |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Fine |
| Python | Interpreter limit of 1000 | 1000 frames | Fine, but the loop is faster and clearer |
| Pascal | The operating system stack | Depends on the platform | Fine |
| JavaScript | The V8 engine limit | About $10^4$ frames | Fine |

The rule of thumb for this article: the recursion depth is a logarithm, so it is never the problem. The problem is the unimodality assumption, and no amount of care in the recursion fixes it.

## Implementation walkthrough

The two lines that carry the technique are the probes and the update.

```cpp
double m1 = lo + (hi - lo) / 3.0;
double m2 = hi - (hi - lo) / 3.0;
if (f(m1) < f(m2)) lo = m1;
else if (f(m1) > f(m2)) hi = m2;
else { lo = m1; hi = m2; }
```

The equality branch keeps the interval between the probes, which is correct for a continuous unimodal function. In the discrete version the corresponding branch is where the bug usually lives: discarding the middle third on equality throws away the peak when the array has a plateau, and the safe rule for a strictly unimodal array is to keep $[m_1, m_2]$.

The probes use floating point division, because the continuous version needs real positions. The discrete version uses integer division, and the two probes must be symmetric, which means computing the second one from the right end rather than as $lo + 2(hi-lo)/3$; the two are not the same when the length is not a multiple of three.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| The function is not unimodal | The search converges to a local peak | Prove the shape, or use a scan |
| The equality branch discards the middle third | A plateau below the peak loses the peak | Keep $[m_1, m_2]$ on equality |
| Using the array version on a function with a flat top | The answer is a point on the plateau, not the peak | Use the continuous version, or handle equality explicitly |
| Comparing $f(m_1)$ with $f(m_2)$ but keeping the wrong half | The peak is discarded | Follow the lemma exactly |
| Stopping when $lo < hi$ rather than when the interval is small enough | The answer is off by the interval width | Stop on the precision |
| Using ternary search to find the maximum element of an array | It is slower than a scan for all but the largest arrays | Scan the array |
| Assuming the probes are symmetric with integer division | The two thirds overlap and the search stalls | Compute the second probe from the right end |

### Why this fails: two probes with equal values

The mistake that survives review is the equality branch of the discrete version. It is written by habit, and it is the branch that never fires on strictly unimodal test data.

The smallest counterexample is the array $[5, 1, 5]$, which is not unimodal at all. Take it with the symmetric split and the middle third discarded on equality.

- $[lo, hi] = [0, 2]$. The length is 2, so $\lfloor 2/3 \rfloor = 0$, which gives $m_1 = 0$ and $m_2 = 2$. The values are $5$ and $5$, so they are equal.
- The equality branch discards the middle third and sets $lo = m_1 + 1 = 1$ and $hi = m_2 - 1 = 1$.
- The interval is now $[1, 1]$ and the answer is $a_1 = 1$.

The maximum of the array is 5, and the search reports 1. It discarded both copies of 5 at the very first step, because it saw two equal values and assumed the plateau was at the top.

Two elements are not enough to break it, because with two elements the two probes are the two elements themselves and any rule that compares them finds the larger one. Three is the smallest array that exposes the flaw.

The second failure is subtler and does not need a non-unimodal array at all. Take the weakly unimodal array $[1, 4, 4, 1]$, which is weakly unimodal with a plateau at the peak. The probes are at indices 1 and 2, both holding 4, so the equality branch discards the middle third and leaves the interval empty. The reported value is 4, which happens to be the maximum, but the peak index is gone and the search has no interval left to report from. An implementation that returns the value at the last probe returns the right number for the wrong reason, and an implementation that reads at the empty interval returns an element outside the array.

The lesson generalizes: **unimodality is a promise about the whole function, and the discrete version cannot check it.** The equality branch is where the promise is used without being verified.

## Variants and extensions

- **Binary search on the slope.** Compare $f(m)$ with $f(m + \delta)$ and follow the larger side. It halves the interval at two evaluations each and uses about half as many evaluations as ternary search.
- **The minimum of a unimodal function.** Reverse the comparisons; the search finds the valley.
- **Ternary search on a discrete unimodal array.** The array version with the equality branch kept inside $[m_1, m_2]$, which is safe for a strictly unimodal array.
- **Multimodal search.** With several hills, the only correct method is to sample the whole interval, and the technique becomes a coarse grid followed by a refinement.
- **The golden section search.** The same idea with a split ratio chosen to minimize the number of evaluations, at the cost of a more obscure constant.
- **Randomized search.** For a landscape of unknown shape, random sampling with a shrinking interval finds a high point with high probability and no unimodality promise at all.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Before writing the code, state why the function is unimodal. If there is no such reason, the technique does not apply.
2. Check whether a simpler tool answers the question: a scan for an array, a binary search for a monotone predicate.
3. In the discrete version, decide what the equality branch does, and write it down.
4. Use symmetric probes, computing the second one from the right end.
5. Count the evaluations, and compare them with the cost of a scan.
6. Test three arrays by hand: a strictly increasing one, a strictly decreasing one, and one with a plateau.

## Worked problems

### Problem 1: the highest point of the terrain

**Restatement.** A function $f$ on $[0, 100]$ is unimodal. Find a point where it attains its maximum, accurate to within $10^{-6}$. Constraints: $f$ is unimodal and can be evaluated in constant time.

**Naive baseline.** A grid of $10^8$ samples, at $10^8$ evaluations.

**Insight.** Two probes rule out a third of the interval, and the peak must be in the half that survives.

**Derivation.** Run the continuous ternary search until the interval is shorter than $10^{-6}$, and return its midpoint.

**Correctness.** The invariant keeps a peak inside the interval at every step.

**Complexity.** About 45 iterations and 90 evaluations.

**Common wrong approach.** Stopping when the two probes are equal rather than when the interval is small enough, which returns a point on a plateau rather than the peak.

### Problem 2: the peak index of a weakly unimodal array

**Restatement.** Given an array that is non-decreasing and then non-increasing, report an index of a maximum element. Constraints: $1 \le n \le 10^6$.

**Naive baseline.** A scan, at $O(n)$.

**Insight.** The array is weakly unimodal, so the peak can be found by a search, but the equality branch must not discard the plateau.

**Derivation.** Run the discrete search, and on equality keep the interval $[m_1, m_2]$ rather than discarding the middle third. When the interval has collapsed, the answer is the largest value seen.

**Correctness.** By the lemma, each branch keeps a peak, and the equality branch keeps the plateau that may contain it.

**Complexity.** $O(\log n)$ iterations and $O(1)$ space.

**Common wrong approach.** Discarding the middle third on equality, which can leave the search with an empty interval.

### Problem 3: the deepest point of a cave

**Restatement.** The depth of a cave along a corridor is a unimodal function of the distance from the entrance, and the corridor is 200 meters long. Find the deepest point to within a centimeter.

**Naive baseline.** A grid of $20\,000$ samples, at $20\,000$ evaluations.

**Insight.** The same halving applies, and the length of the corridor fixes the number of iterations.

**Derivation.** Run the continuous search with $\varepsilon = 0.01$ over $[0, 200]$. The number of iterations is $\log_{3/2}(20000) \approx 25$, so about 50 evaluations.

**Correctness.** The invariant argument gives the accuracy, and the termination condition gives the precision.

**Complexity.** About 25 iterations and 50 evaluations.

**Common wrong approach.** Using the discrete search on a corridor sampled at one-meter intervals, which finds a sampled maximum rather than the true one.

## Practice progression

1. **Recognition.** Given a statement, decide whether ternary search applies. Look for a function, for unimodality, and for a precision requirement.
2. **Direct application.** Implement the continuous and the discrete versions, and verify the continuous one against a grid search on a known unimodal function.
3. **Adaptation.** Implement the minimum version, and the discrete version with the equality branch kept inside the probes.
4. **Combination.** Combine the search with a monotone predicate by searching for the crossing point of two monotone functions, which is a binary search over a monotone predicate.
5. **Challenge.** Solve a problem where the function is unimodal but its evaluation is expensive, and show that the slope-based binary search needs about half as many evaluations.
6. **Transfer.** Recognize the shape in a different setting: the peak of a probability density estimated from data, the turning point of a concave function found by a chord search, and the randomized search for a point of high value in a landscape of unknown shape.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is unimodality, and how does it differ from monotonicity? (Formal model)
2. State the lemma that says where the peak lies in each of the three cases. (Formal model)
3. Why does the search discard a third of the interval at every step? (Key insight)
4. How many function evaluations does ternary search spend, and how does that compare with binary search on the slope? (Complexity analysis)
5. Give the smallest array that breaks the discrete version. (Common mistakes)
6. Why is the equality branch of the discrete version dangerous? (Implementation walkthrough)
7. When is a plain scan better than a ternary search on an array? (Algorithm selection)
8. What is the invariant of the search, and which lemma preserves it? (Correctness proof)
9. How do you compute the two probes symmetrically with integer division? (Implementation walkthrough)
10. Why does the continuous version survive a plateau and the discrete version not? (Common mistakes)
11. What does the recursion depth look like, and is it ever the problem? (Recursion decision)
12. Which contest technique has the same shape but a stronger promise? (Algorithm selection)

## Further reading

- The halving over a monotone predicate, which is what contest problems actually need, is in [binary search](/algorithms/searching/binary-search).
- The version that searches the space of answers rather than the data is in [binary search on the answer](/algorithms/searching/binary-search-on-answer).
- The scan that finds a boundary in a sorted sequence is in [two pointers](/algorithms/searching/two-pointers).
- The ordered structure that answers range maxima exactly is in [segment tree](/algorithms/range-queries/segment-tree).
- The technique that finds the nearest greater element, which answers a different nearest-neighbor question, is in [monotonic stack](/algorithms/arrays/monotonic-stack).
