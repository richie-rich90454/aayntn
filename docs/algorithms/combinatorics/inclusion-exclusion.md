---
id: combinatorics.inclusion-exclusion
title: Inclusion and exclusion
summary: Count the union of overlapping sets by adding the individual sets and subtracting the overlaps, and apply the same alternating sum to count the objects that avoid a list of forbidden properties.
division: [gold, platinum]
subjects: [combinatorics]
level: advanced
importance: common-contest-technique
keywords:
    [
        inclusion and exclusion,
        principle of inclusion and exclusion,
        union,
        intersection,
        mobius function,
        mobius inversion,
        coprime pairs,
        forbidden properties,
    ]
prerequisites:
    required: [combinatorics.binomial-coefficients]
    recommended: [foundations.complexity, number-theory.modular-arithmetic]
complexity:
    time: "O(2^m)"
    space: "O(1) to O(m)"
assumptions:
    - The forbidden properties are events on a finite universe, so that every object belongs to some well-defined subset of the event families.
    - The count of each intersection of a subfamily is known or can be computed independently.
reviewed: false
---

## At a glance

Inclusion and exclusion is the rule that counts a union of overlapping sets by an alternating sum of the sizes of the intersections.

| Property | Value |
| --- | --- |
| **Problem** | Count the objects that satisfy at least one, or none, of a list of conditions |
| **Two sets** | $\lvert A \cup B\rvert = \lvert A\rvert + \lvert B\rvert - \lvert A \cap B\rvert$ |
| **$m$ sets** | $\sum_{\emptyset \ne S} (-1)^{\lvert S\rvert + 1} \lvert \bigcap_{i \in S} A_i\rvert$ |
| **Time** | $O(2^m)$ terms for $m$ conditions, or $O(n)$ after a sieve |
| **Auxiliary space** | $O(1)$ beyond the input, or $O(n)$ for the sieve |
| **Requires** | A count for every intersection of a subfamily of the conditions |
| **Fails when** | The conditions are not events on a common universe, or the number of conditions is too large for $2^m$ |

The rule is worth learning in one form and applying in another. The form is the alternating sum over subsets. The application is usually the other direction: you are given a universe of $n$ objects, a list of $m$ "bad" properties, and you want the objects with none of them. That is a union of good properties, which is the complement of a union of bad ones, and the counting argument is exactly the same.

## Problem motivation

A club has $n = 100$ students. Twenty of them take algorithms, thirty take theory, and twenty-five take programming. Ten take both algorithms and theory, eight take both algorithms and programming, six take both theory and programming, and three take all three. How many students take at least one of the three courses?

The naive baseline enumerates the students and marks which courses each one takes, which is $O(n)$ and is the right answer when the individual membership lists are given.

The problem usually presents the data the other way around: only the nine numbers above, with no per-student information. Then the only thing to do is combine the nine numbers, and the combination is not a simple sum because the students taking two courses are counted twice and the ones taking three are counted three times.

The difficulty is that every correction step creates a new overcount. Subtracting the pairwise intersections fixes the students in exactly two courses, but it subtracts the students in all three courses three times when they should have been subtracted twice. The alternating sum is what keeps the bookkeeping exact, and the proof of why it is exact is the whole subject of this article.

The second problem in the family is the one where the universe is huge and the bad conditions are simple. "How many integers from $1$ to $10^9$ are divisible by $2$, $3$, or $5$?" The answer is $10^9 - \sum_{d \in \{2,3,5\}} \lfloor 10^9/d \rfloor + \sum_{d \in \{6,10,15\}} \lfloor 10^9/d \rfloor - \lfloor 10^9/30\rfloor$, and the same idea with a sieve of smallest prime factors counts the integers divisible by none of a long list of primes.

## Recognition patterns

Inclusion and exclusion is the right tool when the statement contains some of these phrases.

- "At least one of", "one or more of", "any of the following".
- "None of", "not", "avoid", "is not divisible by", "uses neither".
- "How many are in at least one group", "how many are in no group".
- "Count the complement", "the total minus the bad ones".
- "Exactly", where the objects have several properties and exactly one of them is wanted.
- A list of conditions and a universe, with the counts of the conditions given but not the counts of the overlaps.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $m \le 10$ conditions | $2^{10} = 1024$ terms, which is instant |
| $m \le 20$ conditions | $2^{20} \approx 10^6$ terms, which is a second or two |
| $m \le 30$ conditions | $2^{30} \approx 10^9$ terms, which is too slow |
| The conditions are all "divisible by a prime" | A sieve of the smallest prime factor replaces the $2^m$ terms |
| The conditions are "the object has property $i$" and the counts of the single properties are given but not the overlaps | The data is insufficient; inclusion and exclusion needs the intersection counts |
| The universe is a set of $n$ objects given one by one | A linear scan with a bitmask is simpler and faster |
| The answer must be exact and enormous | The count is still computed by the same sum, and the size decides whether it fits |

The third row is the practical boundary and it is worth memorizing: the number of terms doubles with every added condition, so a problem with 25 conditions needs $3 \times 10^7$ terms and a problem with 30 needs a billion. When the conditions are of a special shape, a different technique replaces the sum.

## Naive approach

The baseline is the direct count of the union by inclusion-exclusion truncated to pairs, which is the mistake that motivates the whole article. It is listed here because it is what most people write.

```python
def union_wrong(sizes, pairs):
    total = sum(sizes)
    for size in pairs:
        total -= size
    return total
```

For three sets with sizes $5, 6, 7$ and pairwise intersections $2, 3, 2$, this returns $5+6+7-2-3-2 = 11$. The correct answer is $12$, because one student takes all three courses and must be counted once, not zero.

The second baseline is the honest one: enumerate the universe.

```python
def union_by_scan(members):
    return sum(1 for m in members if m)
```

This is $O(n)$ and always right when the per-object data exists. It is the reference implementation for the differential test, and it is the answer whenever the statement gives you the objects rather than the aggregate counts.

## Key insight

The insight is that **every object in a union should be counted exactly once, and the alternating sum does that automatically.**

Fix an object $x$. Suppose it belongs to exactly $r$ of the sets $A_1, \ldots, A_m$. In the alternating sum

$$
\lvert A_1\rvert + \cdots + \lvert A_m\rvert - \sum_{i < j} \lvert A_i \cap A_j\rvert + \sum_{i < j < k} \lvert A_i \cap A_j \cap A_k\rvert - \cdots
$$

the object contributes once for each set it is in, minus once for each pair of sets it is in, plus once for each triple, and so on. The total contribution of $x$ is therefore

$$
\binom{r}{1} - \binom{r}{2} + \binom{r}{3} - \cdots + (-1)^{r+1}\binom{r}{r},
$$

which is $1$ when $r \ge 1$ and $0$ when $r = 0$. So the sum counts exactly the objects that are in at least one set, each exactly once. That is the entire proof, and it is short enough to remember.

The second insight is the direction the technique is actually used in. When the universe is $\{1, 2, \ldots, n\}$ and the bad conditions are $A_1, \ldots, A_m$, the objects with **none** of the bad properties are the complement of the union, so the count is

$$
n - \lvert A_1 \cup \cdots \cup A_m\rvert.
$$

Substituting the formula and flipping the sign of every term gives the form that appears in contest solutions:

$$
\text{count} = n - \sum_i \lvert A_i\rvert + \sum_{i < j} \lvert A_i \cap A_j\rvert - \sum_{i < j < k} \lvert A_i \cap A_j \cap A_k\rvert + \cdots
$$

The terms with $j$ chosen conditions are the count of objects divisible by the product of those $j$ numbers, when the conditions are divisibility conditions, because an integer divisible by each of $d_1, \ldots, d_j$ is divisible by their product.

## Formal model

Let $U$ be a finite universe and let $A_1, \ldots, A_m$ be subsets of $U$.

<MathPanel type="definition" title="Definition">
The **principle of inclusion and exclusion** is the identity
$$
\left| \bigcup_{i=1}^{m} A_i \right|
= \sum_{\emptyset \ne S \subseteq \{1, \ldots, m\}}
(-1)^{|S|+1} \left| \bigcap_{i \in S} A_i \right|,
$$
where the intersection over an empty index set is understood to be $U$.
</MathPanel>

<MathPanel type="definition" title="Definition">
The **Möbius function** $\mu$ is defined on the positive integers by
$\mu(1) = 1$, by $\mu(d) = 0$ when $d$ is divisible by the square of a
prime, and by $\mu(d) = (-1)^{\omega(d)}$ when $d$ is a product of
$\omega(d)$ distinct primes. It satisfies
$$
\sum_{d \mid g} \mu(d) = \begin{cases} 1 & \text{if } g = 1, \\ 0 & \text{if } g > 1. \end{cases}
$$
</MathPanel>

<MathPanel type="lemma" title="Lemma">
Let $x$ be an element of $U$ that belongs to exactly $r$ of the sets
$A_1, \ldots, A_m$. Then the contribution of $x$ to the right-hand side of
the principle of inclusion and exclusion is
$$
\sum_{j=1}^{r} (-1)^{j+1} \binom{r}{j},
$$
which is $1$ if $r \ge 1$ and $0$ if $r = 0$.
</MathPanel>

<MathPanel type="proof" title="Proof">
The subsets $S$ with $x \in \bigcap_{i \in S} A_i$ are exactly the subsets of
the $r$ sets that contain $x$, and there are $\binom{r}{j}$ of them of size
$j$. Hence the total contribution is
$\sum_{j=1}^{r} (-1)^{j+1}\binom{r}{j}$. Expanding $(1-1)^r = 0$ for
$r \ge 1$ gives
$$
\sum_{j=0}^{r} (-1)^j \binom{r}{j} = 0,
$$
and removing the $j = 0$ term, which is $1$, leaves $\sum_{j=1}^{r}
(-1)^{j+1}\binom{r}{j} = 1$. For $r = 0$ the sum is empty and equals $0$.
$\square$
</MathPanel>

<MathPanel type="invariant" title="Invariant">
In the combinatorial sieve for coprime pairs, after the primes up to $p$
have been processed, the running value
$$
S(p) = \sum_{d \le p} \mu(d) \left\lfloor \frac{n}{d} \right\rfloor^{2}
$$
equals the number of ordered pairs $(a,b)$ with $1 \le a, b \le n$ such that
no prime at most $p$ divides both $a$ and $b$. When $p = n$, every prime
that could divide both has been considered, so $S(n)$ is the number of
coprime pairs.
</MathPanel>

## Algorithm derivation

The direct evaluation of the principle for $m$ conditions enumerates all nonempty subsets of the conditions.

```python
from itertools import combinations

def union_size(m, intersection_size):
    total = 0
    for size in range(1, m + 1):
        sign = 1 if size % 2 == 1 else -1
        for subset in combinations(range(m), size):
            total += sign * intersection_size(subset)
    return total
```

The `intersection_size` callback is the part that carries the problem-specific knowledge. For divisibility conditions it is $\lfloor n / \prod_{i \in S} d_i \rfloor$; for geometric conditions it is the area of the intersection; for a table of membership counts it is a lookup.

The sign is the only thing that varies with the size of the subset, and it alternates starting with a plus for odd sizes. It is easier to get right when the enumeration is written as a recursive function that carries the sign as a parameter, because then the sign flips at every level of the recursion instead of being recomputed.

The sieve form replaces the $2^m$ terms with $O(n)$ terms. When the conditions are "the object is divisible by the prime $p$", the intersection of a subfamily of size $j$ is counted by $\lfloor n / \prod p \rfloor$, and grouping the subsets of primes by their product gives the Möbius sum

$$
\text{count} = \sum_{d=1}^{n} \mu(d) \left\lfloor \frac{n}{d} \right\rfloor^{2}.
$$

The Möbius function itself is computed by a sieve in $O(n \log \log n)$: set $\mu(1) = 1$, set $\mu(d) = 0$ for every $d$ divisible by a prime square, and for each prime $p$ negate $\mu$ on the multiples of $p$ that are not divisible by $p^2$.

## Step-by-step execution

Take three courses. Let $A$ be the students taking algorithms, $B$ the students taking theory, and $C$ the students taking programming.

**The two-set case.** Suppose first that only $A$ and $B$ exist. With $|A| = 5$, $|B| = 6$ and $|A \cap B| = 2$, the union is

$$
|A \cup B| = 5 + 6 - 2 = 9.
$$

The subtraction is needed because the two students in both courses were counted twice, once in each $|A|$ and once in each $|B|$, so they were counted twice in total and must be counted once.

**The three-set case.** Now add $C$ with $|C| = 7$, $|A \cap C| = 3$, $|B \cap C| = 6$... let us take $|B \cap C| = 6$? No: with $|B| = 6$ a pairwise intersection of $6$ is possible, but then $B \subseteq C$. Let $|B \cap C| = 2$ and $|A \cap B \cap C| = 1$, which is the data from the motivation. The union is

$$
|A \cup B \cup C| = (5 + 6 + 7) - (2 + 3 + 2) + 1 = 18 - 7 + 1 = 12.
$$

Each of the seven students in exactly two courses is added twice and subtracted once, for a net of one. The single student in all three courses is added three times, subtracted three times, and added once more, for a net of one. Every one of the twelve students in at least one course is counted once, and the student in none of them is not counted at all.

**The coprime pairs.** Take $n = 3$ and count the ordered pairs $(a,b)$ with $1 \le a, b \le 3$ and $\gcd(a,b) = 1$. The bad events are $A_2 = \{(a,b) : 2 \mid a \text{ and } 2 \mid b\}$ and $A_3 = \{(a,b) : 3 \mid a \text{ and } 3 \mid b\}$. Their sizes are $\lfloor 3/2 \rfloor^2 = 1$ and $\lfloor 3/3 \rfloor^2 = 1$, and their intersection is empty because no pair in $\{1,2,3\}^2$ has both coordinates divisible by $6$. So the count of pairs in no bad event is $3^2 - 1 - 1 + 0 = 7$. The seven pairs are $(1,1)$, $(1,2)$, $(1,3)$, $(2,1)$, $(2,3)$, $(3,1)$, $(3,2)$; the two missing ones are $(2,2)$ and $(3,3)$.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
Let $A_1, \ldots, A_m$ be subsets of a finite universe $U$. The principle of
inclusion and exclusion computes $\lvert \bigcup_i A_i\rvert$ exactly. In
particular, the number of ordered pairs $(a,b)$ with $1 \le a, b \le n$ and
$\gcd(a,b) = 1$ is
$$
\sum_{d=1}^{n} \mu(d) \left\lfloor \frac{n}{d} \right\rfloor^{2}.
$$
</MathPanel>

<MathPanel type="proof" title="Proof">
**The union.** Sum the right-hand side over all $x \in U$. An element $x$
that lies in exactly $r$ of the sets contributes
$\sum_{j=1}^{r}(-1)^{j+1}\binom{r}{j}$, which is $1$ when $r \ge 1$ and $0$
when $r = 0$, by the lemma. Therefore the sum counts each element of the
union exactly once and each element outside it zero times, which is
$\lvert \bigcup_i A_i \rvert$.

**The coprime pairs.** Let $P$ be the set of primes at most $n$, and for each $p \in P$ let $B_p$ be the set of ordered pairs $(a,b)$ with $1 \le a, b \le n$ such that $p$ divides both $a$ and $b$. An ordered pair is coprime exactly when it lies in no $B_p$, because a common divisor greater than $1$ has a prime factor. The size of $B_p$ is $\lfloor n/p \rfloor^2$, and for a subfamily with product $d$ the size of the intersection is $\lfloor n/d \rfloor^2$, because an integer is divisible by every prime of the subfamily exactly when it is divisible by their product $d$. Inclusion and exclusion therefore gives the count of coprime pairs as

$$
n^2 - \sum_{p} \left\lfloor \frac{n}{p} \right\rfloor^{2}
+ \sum_{p < q} \left\lfloor \frac{n}{pq} \right\rfloor^{2} - \cdots
= \sum_{S \subseteq P} (-1)^{|S|} \left\lfloor \frac{n}{\prod_{p \in S} p} \right\rfloor^{2},
$$

where the product of the empty set is $1$. Group the subsets $S$ by their product $d$. The product is squarefree, and the number of subsets with product $d$ is $\mu(d)$: it is $1$ for $d = 1$, it is $(-1)^{\omega(d)}$ when $d$ is a product of $\omega(d)$ distinct primes, and no subset of primes has a product divisible by a prime square, so the terms with $\mu(d) = 0$ contribute nothing. Summing over all $d$ at most $n$ gives $\sum_{d=1}^{n} \mu(d)\lfloor n/d \rfloor^2$, as claimed. $\square$
</MathPanel>

## Complexity analysis

The direct evaluation of the principle over $m$ conditions enumerates $2^m - 1$ nonempty subsets, and each term costs whatever the count of that intersection costs.

- **Time:** $O(2^m)$ terms, each $O(1)$ when the intersection counts are given in a table. For $m = 20$ that is about a million terms; for $m = 30$ it is a billion, which is too slow.
- **Auxiliary space:** $O(1)$ with an iterative enumeration over the bitmask of a subset, and $O(m)$ for the recursion that enumerates the subsets.

The sieve form is a different complexity entirely.

- **Time:** $O(n \log \log n)$ to compute the Möbius function for every $d \le n$, plus $O(n)$ to accumulate the sum. A linear sieve computes $\mu$ in $O(n)$.
- **Auxiliary space:** $O(n)$ for the array of Möbius values.

The choice between the two is a choice about the shape of the conditions. A problem with 15 arbitrary conditions and a table of intersection counts wants the $2^m$ form. A problem with a thousand divisibility conditions wants the sieve form, and the sieve form is the only one of the two that finishes.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count the union of $m \le 20$ given sets | Inclusion and exclusion over subsets |
| Count the objects with none of $m$ bad properties | Inclusion and exclusion, with the leading $n$ |
| Count the integers at most $n$ divisible by one of a short list | Inclusion and exclusion over the list |
| Count the integers at most $n$ divisible by one of many primes | A sieve of the smallest prime factor |
| Count the coprime pairs at most $n$ | The Möbius sum, or $2\sum_{k=1}^{n}\varphi(k) - 1$ |
| Count the objects with exactly one of the properties | Inclusion and exclusion plus a correction term |
| Count the surjections or the derangements | Inclusion and exclusion |
| Count the lattice points in a shape | Pick's theorem, not inclusion and exclusion |

The last row is a real trap. A problem that says "count the lattice points inside this polygon" is often solved with [Pick's theorem](/algorithms/geometry/convex-hull), and a program that applies inclusion and exclusion to the polygon's edges will produce a number that is not the answer.

## Recursion decision

The subset enumeration is the one place where the recursive formulation is genuinely the better one, because the sign flips with the depth and the partial product accumulates along the way.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative over the bitmask; the recursive form is fine for $m \le 25$ |
| Java | About $10^4$ frames | Iterative over the bitmask |
| Python | The interpreter limit of 1000 | Iterative; the recursion limit is reached at $m = 1000$, and $2^{1000}$ terms are hopeless anyway |
| Pascal | The operating system stack | Iterative over the bitmask |
| JavaScript | About $10^4$ frames | Iterative over the bitmask |

The depth of the recursive subset enumeration is $m$, the number of conditions, so the stack is never the binding constraint: the $2^m$ terms are. The iterative form over a bitmask from $1$ to $2^m - 1$ is the one to write in a contest, because it has no stack at all and the sign is a single parity test on the population count of the mask.

## Implementation walkthrough

Two lines decide whether the answer is right.

```python
from itertools import combinations

def union_size(m, intersection_size):
    total = 0
    for size in range(1, m + 1):
        sign = 1 if size % 2 == 1 else -1
        for subset in combinations(range(m), size):
            total += sign * intersection_size(subset)
    return total
```

The first is the sign. The term for a subset of size $j$ has sign $(-1)^{j+1}$, which is positive for odd $j$. A program that starts with a minus sign computes the complement by accident, and the complement is usually a much larger number, so the mistake is obvious in the output.

The second is the product of the divisors in the divisibility version.

```python
def divisible_by(n, divisors):
    total = 0
    m = len(divisors)
    for mask in range(1, 1 << m):
        product = 1
        count = 0
        for i, d in enumerate(divisors):
            if mask >> i & 1:
                product *= d
                count += 1
        term = n // product
        total += term if count % 2 == 1 else -term
    return total
```

The product must be computed over the selected divisors only, and the integer division is exact, so the term is the count of multiples of the product. The sign uses the count of selected divisors, which is the same as the number of set bits in the mask.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Stopping at the pairwise terms | Every object in three or more sets is miscounted | Carry the sum to the full alternating series |
| Using the wrong sign on the leading term | The program computes the complement | Odd-sized intersections are added, even-sized ones are subtracted |
| Computing the product of the divisors wrongly | The intersection count is wrong | Multiply the selected divisors, and divide the product into $n$ |
| Applying the rule to conditions on different universes | The sum is meaningless | Check that every condition is a subset of one universe |
| Assuming the conditions are independent | The intersection counts are guessed instead of computed | The count of an intersection is a number, and it must come from the problem |
| Enumerating $2^m$ subsets when $m$ is 30 | The program runs for hours | Look for a sieve or a structural shortcut |
| Forgetting that the empty intersection is $U$ | The $j = 0$ term is missing | Start the mask at $1$, and add the universe term separately |

### Why this fails: the subtraction that stops one step too early

The plausible wrong approach is to add the sizes of the sets and subtract the pairwise intersections, on the belief that every object is in at most two sets. That belief is false exactly when three sets share an object, and the statement "three of my friends all take algorithms" is not a rare event.

The smallest counterexample is three sets that all contain the same single element, say $A = B = C = \{1\}$. The correct union has one element. The pairwise-only formula computes

$$
|A| + |B| + |C| - \lvert A \cap B\rvert - \lvert A \cap C\rvert - \lvert B \cap C\rvert
= 3 - 3 = 0.
$$

The answer is not merely off by one, it is zero, and a program that reports zero for a nonempty union is easy to spot once you have looked for it.

A more realistic smallest counterexample uses three sets of size two: $A = \{1,2\}$, $B = \{1,3\}$, $C = \{1,4\}$. The union is $\{1,2,3,4\}$ with four elements. The pairwise-only formula gives $2 + 2 + 2 - 1 - 1 - 1 = 3$, because the element $1$ was counted three times and subtracted three times.

Two sets is not enough to expose the bug, because with two sets the pairwise term is the last term of the sum and there is nothing to miss. One set is trivial. Three is the smallest number of sets at which the alternating sum has a term that the truncated version omits.

The lesson generalizes: **when a counting argument subtracts a correction, ask how many times the worst-case object was counted, and make sure the corrections cancel exactly.** The same instinct is what produces the constant in the [strip argument](/algorithms/geometry/closest-pair) of the closest-pair algorithm, where the number of candidates in the strip is bounded by a packing argument rather than by a truncated sum.

## Variants and extensions

- **Exactly one property.** The number of objects in exactly $k$ of the sets is $\sum_{j \ge k} (-1)^{j-k}\binom{j}{k} S_j$, where $S_j$ is the sum of the $j$-fold intersections. Derive it by counting each object's contribution with the right weight.
- **Möbius inversion.** The identity $\sum_{d \mid n} \mu(d) = [n = 1]$ inverts a divisibility sum: if $F(n) = \sum_{d \mid n} G(d)$ then $G(n) = \sum_{d \mid n} \mu(d) F(n/d)$.
- **Surjections and derangements.** The number of surjections from an $m$-element set to a $k$-element set is $\sum_{j=0}^{k} (-1)^j \binom{k}{j}(k-j)^m$, and the number of derangements is $\sum_{j=0}^{n} (-1)^j \binom{n}{j}(n-j)!$.
- **The principle applied to a divisibility list.** The count of integers at most $n$ divisible by at least one of $d_1, \ldots, d_m$ is the alternating sum of $\lfloor n / \prod d_i \rfloor$ over the subsets.
- **The complement of a complement.** Counting the objects with none of the bad properties is the complement of the union, which is the same sum with the sign of the leading term flipped and the universe added.
- **A geometric version.** The area of a union of regions is the alternating sum of the areas of the intersections, and the same argument applies to volumes.

## Contest strategy

1. Write down the universe size and the number of conditions before anything else. The product $2^m$ decides the method.
2. Decide whether the question is about the union or about the complement. The complement is usually the easier one to state and is always what "none of" asks.
3. Write the alternating sum out for two sets, then for three, and check the sign on each term. The sign is where the errors live.
4. Enumerate the subsets by bitmask rather than by recursion. The bitmask form has no stack depth and the sign is one parity test.
5. When the conditions are divisibility by primes and there are many of them, switch to the sieve. The [smallest prime factor](/algorithms/number-theory/prime-factorization) sieve is $O(n \log \log n)$ and answers the question directly.
6. Write the brute force over the universe first when the universe is enumerable. It is the reference implementation, and the disagreement between the two is the fastest way to find a wrong sign.
7. Keep the arithmetic exact. Every term is a count, and a count that overflows is a count that is wrong. When the answer is wanted modulo a prime, reduce after every addition, as in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).

## Worked problems

### Problem 1: the club survey

**Restatement.** A club has 100 students. Twenty take algorithms, thirty take theory, twenty-five take programming, ten take algorithms and theory, eight take algorithms and programming, six take theory and programming, and three take all three. How many students take at least one of the three?

**Naive baseline.** Enumerate the 100 students and mark the courses of each, which requires the per-student data that the problem does not give.

**Insight.** The object is a student, and the membership count of each student determines exactly how much that student contributes to the sum.

**Derivation.** Apply the three-set formula: $20 + 30 + 25 - 10 - 8 - 6 + 3 = 54$.

**Correctness.** A student in exactly one course contributes $1$, a student in exactly two contributes $2 - 1 = 1$, and a student in all three contributes $3 - 3 + 1 = 1$. Every student in at least one course is counted once, and the students in none are not counted.

**Complexity.** $O(1)$ arithmetic operations and $O(1)$ space, since the nine numbers are given.

**Common wrong approach.** Stopping at the pairwise terms, which gives $47$ and undercounts the three students in all three courses by two each.

### Problem 2: integers divisible by a short list

**Restatement.** How many integers from $1$ to $10^{9}$ are divisible by $2$, $3$, or $5$?

**Naive baseline.** A linear scan of the $10^9$ integers, which is hopeless and is also unnecessary, because the count is periodic with period $30$.

**Insight.** The bad events are divisibility, and an integer divisible by both $2$ and $3$ is divisible by $6$, so each intersection has a count of $\lfloor 10^9 / d \rfloor$ for the product $d$ of the selected divisors.

**Derivation.** The union is $\lfloor 10^9/2\rfloor + \lfloor 10^9/3\rfloor + \lfloor 10^9/5\rfloor - \lfloor 10^9/6\rfloor - \lfloor 10^9/10\rfloor - \lfloor 10^9/15\rfloor + \lfloor 10^9/30\rfloor$, which is $500000000 + 333333333 + 200000000 - 166666666 - 100000000 - 66666666 + 33333333 = 733333334$.

**Correctness.** Inclusion and exclusion over the three events, with the intersection counts computed from the products, which is exact because the divisors $2, 3, 5$ are pairwise coprime. The proof in the correctness section applies with those three counts substituted.

**Complexity.** $O(2^3)$ terms, and $O(1)$ space. A periodic scan of the $30$ residues gives the same answer in $O(30)$ time and is a good cross-check.

**Common wrong approach.** Forgetting the three pairwise terms and reporting $1033333333$, which exceeds the universe size and is therefore obviously wrong.

### Problem 3: coprime pairs

**Restatement.** Count the ordered pairs $(a,b)$ with $1 \le a, b \le n$ and $\gcd(a,b) = 1$, for $n \le 10^7$.

**Naive baseline.** The Euclidean algorithm for each of the $n^2$ pairs, which is $O(n^2 \log n)$ and hopeless.

**Insight.** A pair is coprime exactly when no prime divides both coordinates, and the count of pairs whose coordinates are both multiples of $d$ is $\lfloor n/d \rfloor^2$.

**Derivation.** Inclusion and exclusion over the primes up to $n$, grouped by the product of the selected primes, gives $\sum_{d=1}^{n} \mu(d) \lfloor n/d \rfloor^2$. Compute the Möbius function with a sieve, then accumulate the sum.

**Correctness.** The theorem above proves the identity. The sieve computes $\mu$ correctly: $\mu(1) = 1$, a prime gets $-1$, a multiple of a prime square gets $0$, and a product of $k$ distinct primes gets $(-1)^k$.

**Complexity.** $O(n \log \log n)$ time and $O(n)$ space for the sieve, plus $O(n)$ for the sum. For $n = 10^7$ that is about $10^8$ operations, which runs in a few seconds.

**Common wrong approach.** Counting the coprime pairs as $2\sum_{k=1}^{n} \varphi(k) - 1$ without noticing that the totient route counts the pairs with $a < b$ twice and the pair $(1,1)$ once, and getting the correction sign wrong. The two formulas agree, and checking them against each other on $n \le 100$ is a good differential test.

## Practice progression

1. **Recognition.** Given a statement, decide whether the question is about a union or about a complement, count the conditions, and write down whether $2^m$ is affordable.
2. **Direct application.** Implement the two-set and three-set formulas, and the subset enumeration, and check all three against a brute force over the universe for every set of at most $3$ subsets of $\{1,2,3,4\}$.
3. **Adaptation.** Write the version for divisibility conditions, the version for "exactly one property", and the version that counts surjections.
4. **Combination.** Combine inclusion and exclusion with the Möbius function and a sieve to count the coprime pairs, and with [prime factorization](/algorithms/number-theory/prime-factorization) to find the smallest prime factor of every number up to $n$.
5. **Challenge.** Solve a problem with 25 conditions where the $2^{25}$ terms are too many, by finding the structure that collapses the sum, and compare the two answers.
6. **Transfer.** Recognize the technique in another subject: the number of lattice points in a polygon, the number of derangements, the number of arrays with no repeated element, or the count of valid passwords excluding a list of forbidden patterns.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the principle of inclusion and exclusion in its general form. (Formal model)
2. Why does the alternating sum count each element of the union exactly once? (Key insight)
3. Give the smallest counterexample to the pairwise-only version. (Common mistakes)
4. What is the contribution of an element that lies in exactly $r$ sets, and what does it equal for $r = 0$? (Formal model)
5. How does the count of the union change when the question asks for none of the conditions? (Key insight)
6. How many terms does the subset enumeration have, and at what value of $m$ does it stop being usable? (Complexity analysis)
7. State the Möbius function and its divisor-sum identity. (Formal model)
8. Derive the count of coprime pairs from the union formula. (Correctness proof)
9. Why does the sieve form of inclusion and exclusion beat the $2^m$ form when there are many conditions? (Algorithm selection)
10. What invariant does the combinatorial sieve for coprime pairs maintain? (Formal model)
11. When is the recursive enumeration of subsets preferable to the bitmask form? (Recursion decision)
12. Which single line of the implementation is most often wrong, and why? (Implementation walkthrough)

## Further reading

- The binomial coefficient that the intersection counts are often expressed with, and the counting argument behind it, are in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The sieve of smallest prime factor, which is the tool that replaces the $2^m$ terms when the conditions are divisibility by many primes, is in [prime factorization](/algorithms/number-theory/prime-factorization).
- The count of the ways to place identical items into distinct boxes, which is a single binomial coefficient rather than a sum, is in [stars and bars](/algorithms/combinatorics/stars-and-bars).
- The arithmetic that keeps a count exact when the numbers are large, and the inverse that a division needs, are in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The discrete mathematics of sets, functions and the proof techniques behind the principle is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The Chinese remainder theorem counts the solutions of a system of congruences, which is a different kind of "the objects that satisfy all the conditions at once". (Algorithm selection)
- The subject index lists this technique, [inclusion and exclusion](/algorithms/combinatorics/inclusion-exclusion), beside the counting arguments it does not yet cover: [the combinatorics](/algorithms/combinatorics/).
