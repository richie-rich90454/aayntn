---
id: dynamic-programming.bitmask-dp
title: Bitmask dynamic programming
summary: Solve a problem over a small set by making the set itself the state of a dynamic program, and encode the set as a bitmask so that the set operations become integer operations.
division: [gold, platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        bitmask dp,
        subset dynamic programming,
        held-karp,
        traveling salesman,
        set cover,
        hamiltonian path,
        bitmask state,
    ]
prerequisites:
    required:
        [foundations.complexity, foundations.binary-representation, enumeration.subset-enumeration]
    recommended: [enumeration.backtracking, dynamic-programming.0-1-knapsack, graphs.representation]
complexity:
    time: "O(n 2^n)"
    space: "O(2^n)"
assumptions:
    - The set of items that the state describes has at most about twenty elements, so that a bitmask fits in a machine word and the table of masks fits in memory.
    - The contribution of a new element to a state depends on the state and on the element, and not on the order in which the elements of the state were added.
    - The answer is a count or a cost that can be combined from the values of the smaller states.
reviewed: false
---

## At a glance

Bitmask dynamic programming is the technique for problems whose state is a **set of items**. The encoding is a bitmask: an integer whose bit $i$ is set when item $i$ is in the set. The set operations then become integer operations, and the dynamic program has one state per subset.

The classic instance is the traveling salesman problem on $n \le 20$ cities, solved in $O(n^2 2^n)$ time by the Held-Karp construction, against $O(n!)$ for the brute-force tour. The cost is $2^{20} \cdot 20 \approx 2 \times 10^7$ states, which is comfortable, against $2^{24} \cdot 24 \approx 4 \times 10^8$, which is not.

Two facts decide whether a problem belongs here.

- The universe is **small**. Twenty items is the practical limit for a table indexed by masks, because $2^{20} = 1\,048\,576$ states and $2^{24} = 16\,777\,216$ states is already at the edge of a 256-megabyte memory limit.
- The future depends on the **set**, not on the order in which the set was built. When the future also depends on the last item added, the state becomes a pair, and the table grows by a factor of $n$.

The technique is worth learning because it converts an exponential search over orderings into an exponential table over sets, and the table can be built in a fixed order rather than searched.

## Problem motivation

A logistics company has a depot and twenty customer sites. Every site must be visited exactly once, and the van must return to the depot. The distances satisfy the triangle inequality, so a tour never benefits from passing through a third site.

The constraints are $n \le 20$ sites, with a distance matrix given in full.

The brute force enumerates the $(n-1)!$ tours. At $n = 20$ that is $19! \approx 1.2 \times 10^{17}$ tours, each costing $O(n)$ to evaluate. No amount of cleverness makes that fit in a time limit.

The right answer is the Held-Karp construction, and its cost is $O(n^2 2^n) = 4 \times 10^8$ operations at $n = 20$, which is about two seconds in C++ and fits comfortably.

The gap between $1.2 \times 10^{17}$ and $4 \times 10^8$ is a factor of $3 \times 10^8$. It comes entirely from one observation: **the set of cities already visited determines everything about the rest of the tour except which city comes next.** The order in which the earlier cities were visited does not matter at all, because the cost of the next step depends only on the current city and the next one, and the set tells you which cities are still available.

Once the observation is made, the state is the set, and the dynamic program has $2^n$ states instead of $n!$.

## Recognition patterns

Bitmask dynamic programming is the right tool when all of the following hold.

- The problem involves a **set of distinguishable items**: cities, people, tasks, subsets of a set, colors, positions.
- The set is **small**, at most about twenty items, and the statement says so or the constraints make it obvious.
- The question is about a **cost, a count, or a feasibility** of a construction that uses every item exactly once, or of a construction over a subset of the items.
- The value of a partial construction depends on **which items it contains**, and the future is decided by that set.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| $n \le 16$ | Comfortable; the whole table is a few hundred thousand entries |
| $n \le 20$ | The practical ceiling; about a million states |
| $n \le 24$ | Possible in C++ with care; $16$ million states, tens of megabytes per array |
| $n \le 30$ | Rules out the flat table; a meet in the middle or a different state is needed |
| $n \le 10^5$ | Rules out the technique entirely; the set is not a viable state |
| The order of the items matters and the cost is not decomposable | Rules out the plain mask state; a pair of masks may be needed |
| The set of items is not given in advance | Rules out the technique; the universe must be known to index the mask |

The last two rows are the ones that decide between the two forms of the technique. A problem about the **traveling salesman** needs to know the current city, so the state is (set, current). A problem about **assigning students to rooms** does not, because the room being filled is a function of how many students have been placed. The second form has $2^n$ states; the first has $n 2^n$.

A phrase in a statement that points at this technique is "**exactly once**", or "each ... exactly one". A phrase that rules it out is "**at most**", when the choice of which items to leave out is free, because then the state is the set of items used and the program must consider all $2^n$ of them, which is the same table but with a different update.

## Naive approach

The baseline enumerates the orderings.

```python
def tsp_brute_force(dist, start):
    n = len(dist)
    others = [v for v in range(n) if v != start]
    best = float("inf")
    for order in permutations(others):
        total = dist[start][order[0]]
        for i in range(len(order) - 1):
            total += dist[order[i]][order[i + 1]]
        total += dist[order[-1]][start]
        best = min(best, total)
    return best
```

This is correct and it is the reference implementation for the differential test on five or six cities. It is also $O(n! \cdot n)$ time, which at $n = 20$ is hopeless.

The second baseline is the recursive search with memoization, and it is instructive because it is where the state must be discovered rather than designed.

```python
def tsp_memo(dist, start, mask):
    if mask == (1 << len(dist)) - 1:
        return dist[current][start]      # the return edge
    best = float("inf")
    for nxt in range(len(dist)):
        if mask & (1 << nxt):
            continue
        best = min(best, dist[current][nxt] + tsp_memo(dist, start, mask | (1 << nxt)))
    return best
```

The memoization is what makes it work, and the state that falls out of it is exactly the pair (mask, current). The point of the bitmask formulation is that it makes the state explicit before the code is written, so that the memory can be laid out as an array rather than a hash table, and so that the order of evaluation can be chosen rather than discovered.

## Key insight

The insight is that **the set of items already used determines everything about the rest of the construction, provided the value of the partial construction does not depend on the order in which the items were added.**

Write the claim carefully. Suppose that a partial construction is described by a set $S$, and that its value $f(S)$ is well defined, meaning that every way of building $S$ has the same value. Then the best extension of $S$ is

$$
f(S \cup \{v\}) = \min_{u \in S} \bigl(f(S) + c(u, v)\bigr)
$$

for a cost $c$ that depends on the last item added and the new one. This is a recurrence over sets, and it is the whole technique.

The condition "every way of building $S$ has the same value" is exactly the condition that the problem must satisfy for the plain mask state to be enough. In the traveling salesman problem it fails, because the cost of the next step depends on where the van currently is, so the value of $S$ is not well defined on its own. The repair is to add the current city to the state, giving $f(S, u)$.

There is a second insight, about the size. The number of subsets of an $n$-element set is $2^n$, whereas the number of orderings of a subset is $|S|!$. The dynamic program is exponential either way, but $2^n$ is exponentially smaller than $n!$, and it is small enough to fit in memory for $n$ up to about twenty.

## Formal model

Let $U = \{0, 1, \ldots, n-1\}$ be a set of $n$ distinguishable items. A subset $S \subseteq U$ is encoded by the mask

$$
\operatorname{mask}(S) = \sum_{i \in S} 2^i.
$$

::: math definition Definition
The **popcount** of a mask $m$ is the number of set bits of $m$, written
$\operatorname{pc}(m)$. It equals $|S|$ when $m = \operatorname{mask}(S)$.
The **least set bit** of a nonzero mask $m$ is $m \mathbin{\&} (-m)$, and it
equals $2^i$ where $i$ is the smallest index in $S$.
:::


::: math definition Definition
A problem has the **subset property** if there is a function $f$ on the
subsets of $U$ such that, for every subset $S$ and every ordering of $S$,
the value of the construction built on that ordering is $f(S)$. A problem
has the **ordered subset property** if instead there is a function $f$ on
pairs $(S, u)$ with $u \in S$, giving the value of a construction that has
used exactly the items of $S$ and currently sits at item $u$.
:::


::: math definition Definition
For a problem with the ordered subset property, the **transition** from
$(S, u)$ to $(S \cup \{v\}, v)$ has cost $c(u, v)$, where $c$ depends only
on $u$ and $v$. The **terminal cost** is a value $c_{\text{end}}(S, u)$
charged once when every item has been used.
:::


::: math lemma Lemma
A problem with the subset property is solved by a dynamic program whose
states are the subsets of $U$ and whose transitions add one item. A problem
with only the ordered subset property is solved by a dynamic program whose
states are the pairs $(S, u)$.
:::


::: math proof Proof
Consider the subset case. Any construction on a set $S \cup \{v\}$ removes
$v$ to give a construction on $S$, and by the subset property the value of
the construction on $S$ is $f(S)$ regardless of its order. The
contribution of $v$ is determined by the construction on $S$ and by $v$.
Taking the best over all choices therefore yields a function of the set
alone, and the recurrence is well defined.

In the ordered case the same argument applies to pairs, because the removal of $v$ from a construction that ends at $v$ leaves a construction on $S$ that ends at some $u \in S$, and the value of that construction is $f(S, u)$. $\square$
:::


## Algorithm derivation

### The subset form

Let $f[S]$ be the value of the best construction on the set $S$, and let $\operatorname{last}(S)$ be the item added last, which the problem must supply. The recurrence is

$$
f[\varnothing] = 0,
$$

$$
f[S] = \min_{v \in S} \bigl(f[S \setminus \{v\}] + c(\operatorname{last}(S \setminus \{v\}), v)\bigr),
$$

and the answer is $f[U]$.

The order of evaluation is by popcount: every subset of size $k$ is computed after every subset of size $k-1$. In practice the subsets are enumerated in increasing numerical order of the mask when the subsets are built by adding bits, but that is not correct in general, and the popcount order is the safe statement.

### The ordered form

Let $f[S][u]$ be the value of the best construction that has used exactly the items of $S$ and currently sits at $u$, where $u \in S$. The state for a single item is

$$
f[\{u\}][u] = c(\text{start}, u),
$$

and the transition is

$$
f[S \cup \{v\}][v] = \min_{u \in S} \bigl(f[S][u] + c(u, v)\bigr)
\quad\text{for every } v \notin S.
$$

The answer is

$$
\min_{u \in U} \bigl(f[U][u] + c_{\text{end}}(U, u)\bigr).
$$

The transition is a loop over the items of $S$, so it costs $O(n)$ per state and $O(n^2 2^n)$ overall.

::: math invariant Invariant
When the program writes the state $f[S \cup \{v\}][v]$, every state whose
subset is a proper subset of $S \cup \{v\}$ already holds its final value,
because the evaluation order visits the subsets in increasing popcount.
Every value written into the table is the cost of an actual path, and the
table entry is the minimum over all such paths.
:::


### Laying out the table

The table of the ordered form has $2^n \cdot n$ entries. The layout that matters is the **index computation**: for a flat array of `int` of size $2^n \cdot n$, the entry for the pair $(S, u)$ is at `S * n + u`. A second layout, `dp[1 << n][n]`, is the same thing with the multiplication done by the compiler.

Two memory numbers decide the feasible $n$.

| $n$ | States $2^n$   | Ordered table $n 2^n$ entries | Time $O(n^2 2^n)$ |
| --- | -------------- | ----------------------------- | ----------------- |
| 16  | $65\,536$      | about $1$ million             | $1.7 \times 10^7$ |
| 20  | $1\,048\,576$  | about $21$ million            | $4.2 \times 10^8$ |
| 22  | $4\,194\,304$  | about $92$ million            | $2 \times 10^9$   |
| 24  | $16\,777\,216$ | about $400$ million           | $9.7 \times 10^9$ |

At $n = 20$ an `int` table of the ordered form is $84$ megabytes, which is inside a $256$-megabyte limit and outside a $64$-megabyte one. The subset form is $n$ times smaller, and it is the right choice whenever the problem allows it.

## Step-by-step execution

Take four cities $0, 1, 2, 3$ with the asymmetric distance matrix

| From \ To | 0   | 1   | 2   | 3   |
| --------- | --- | --- | --- | --- |
| 0         | 0   | 10  | 15  | 20  |
| 1         | 10  | 0   | 35  | 25  |
| 2         | 15  | 35  | 0   | 30  |
| 3         | 20  | 25  | 30  | 0   |

and a tour that starts at city $0$ and returns to city $0$.

The state is $f[S][u]$: the cost of the best path that starts at city $0$, visits exactly the cities of $S$, and ends at $u$. The return edge to city $0$ is charged at the end and never during the search, so the state $f[\{0,1\}][0]$ is infinite: a path that is back at the start has already come home, and the convention forbids that until the end.

The singletons are the base cases, and they are the value most often forgotten when the tour does not start at every city.

| $S$       | $u$ | $f[S][u]$ | Route     | Cost |
| --------- | --- | --------- | --------- | ---- |
| $\{0\}$   | 0   | 0         | start     | 0    |
| $\{0,1\}$ | 1   | 10        | $0 \to 1$ | 10   |
| $\{0,2\}$ | 2   | 15        | $0 \to 2$ | 15   |
| $\{0,3\}$ | 3   | 20        | $0 \to 3$ | 20   |

The three-city states follow the recurrence, and two of them are worth showing in full because they are the ones that break the set-only variant.

| $S$         | $u$ | Candidates                     | $f[S][u]$ | Best route      | Cost |
| ----------- | --- | ------------------------------ | --------- | --------------- | ---- |
| $\{0,1,2\}$ | 2   | $10 + 35 = 45$, $15 + 35 = 50$ | 45        | $0 \to 1 \to 2$ | 45   |
| $\{0,1,2\}$ | 1   | $15 + 35 = 50$                 | 50        | $0 \to 2 \to 1$ | 50   |
| $\{0,1,3\}$ | 3   | $10 + 25 = 35$                 | 35        | $0 \to 1 \to 3$ | 35   |
| $\{0,1,3\}$ | 1   | $20 + 25 = 45$                 | 45        | $0 \to 3 \to 1$ | 45   |
| $\{0,2,3\}$ | 3   | $15 + 30 = 45$                 | 45        | $0 \to 2 \to 3$ | 45   |
| $\{0,2,3\}$ | 2   | $20 + 30 = 50$                 | 50        | $0 \to 3 \to 2$ | 50   |

The full set is the last three rows, and the return edge is added to each of them.

| $S$ | $u$ | Candidates                     | $f[S][u]$ | Best route            | With the return |
| --- | --- | ------------------------------ | --------- | --------------------- | --------------- |
| $U$ | 1   | $50 + 35 = 85$, $45 + 25 = 70$ | 70        | $0 \to 2 \to 3 \to 1$ | $70 + 10 = 80$  |
| $U$ | 2   | $45 + 35 = 80$, $35 + 30 = 65$ | 65        | $0 \to 1 \to 3 \to 2$ | $65 + 15 = 80$  |
| $U$ | 3   | $50 + 25 = 75$, $45 + 30 = 75$ | 75        | a tie                 | $75 + 20 = 95$  |

The answer is $80$, achieved by the tour $0 \to 1 \to 3 \to 2 \to 0$ with cost $10 + 25 + 30 + 15 = 80$, and also by the tour $0 \to 2 \to 3 \to 1 \to 0$ with cost $15 + 30 + 25 + 10 = 80$. The remaining four tours cost $95$ each.

The row for $U$ and $u = 1$ shows the last two candidates. The value $50$ for $f[\{0,1,2\}][1]$ comes from the route $0 \to 2 \to 1$, and the value $45$ for $f[\{0,2,3\}][3]$ comes from the route $0 \to 2 \to 3$. Extending the first by the edge $1 \to 3$ gives $75$, and extending the second by the edge $3 \to 1$ gives $70$. The program keeps the cheaper of the two and does not record which route produced it, which is exactly the information the ordered state is designed to carry.

The row for $\{0,1\}$ makes the same point in the smallest possible case. The set $\{0,1\}$ has one finite value in this table, $f[\{0,1\}][1] = 10$, and that value is only meaningful because the program also knows that the van is at city $1$ rather than at city $0$.

## Correctness proof

::: math theorem Theorem
The ordered-form dynamic program computes $f[S][u]$ correctly for every
subset $S$ and every $u \in S$, and the minimum of $f[U][u] + c_{\text{end}}(U, u)$
over $u$ is the cost of the optimal tour.
:::


::: math proof Proof
The proof is an induction on $|S|$.

**Base case.** For $|S| = 1$, say $S = \{u\}$, the only construction is the one that goes directly from the start to $u$, and $f[\{u\}][u] = c(\text{start}, u)$ is its cost. The claim holds.

**Inductive step.** Let $|S| = k > 1$ and let $v \in S$. Take any construction that has used exactly the items of $S$ and sits at $v$. The construction has a predecessor: it was at some city $u \in S \setminus \{v\}$ before the last move, and the move from $u$ to $v$ cost $c(u, v)$. By the induction hypothesis, the part of the construction up to $u$ has cost at least $f[S \setminus \{v\}][u]$. So the construction costs at least $f[S \setminus \{v\}][u] + c(u, v) \ge \min_{u \in S \setminus \{v\}} (f[S \setminus \{v\}][u] + c(u, v))$, which is the value the recurrence assigns to $f[S][v]$.

Conversely, let $u$ attain the minimum. By the induction hypothesis there is a construction with cost $f[S \setminus \{v\}][u]$ that ends at $u$ and has used exactly $S \setminus \{v\}$. Appending the move to $v$ produces a construction on $S$ ending at $v$ with cost exactly $f[S][v]$. So the bound is achieved, and the recurrence is correct.

**The answer.** Every tour uses every city and ends at some city $u$, and the return edge costs $c_{\text{end}}(U, u)$. Minimizing over $u$ therefore gives the optimal tour. $\square$
:::


::: math theorem Theorem
The subset form is correct for every problem with the subset property.
:::


::: math proof Proof
The proof mirrors the one above with the current item removed from the
state. Let $S$ be a subset and $v \in S$. Any construction on $S$ removes
$v$ and leaves a construction on $S \setminus \{v\}$, whose value is
$f[S \setminus \{v\}]$ by the subset property, so the construction's value
is at most $f[S \setminus \{v\}] + c(\operatorname{last}(S \setminus \{v\}), v)$.
Conversely, the best construction on $S \setminus \{v\}$ followed by $v$
achieves that value. Minimizing over $v$ gives $f[S]$. $\square$
:::


## Complexity analysis

| Form                       | States  | Transitions per state | Time            | Space      |
| -------------------------- | ------- | --------------------- | --------------- | ---------- |
| Subset                     | $2^n$   | $O(n)$                | $O(n 2^n)$      | $O(2^n)$   |
| Ordered                    | $n 2^n$ | $O(n)$                | $O(n^2 2^n)$    | $O(n 2^n)$ |
| Brute force over orderings | $n!$    | $O(n)$                | $O(n! \cdot n)$ | $O(n)$     |

The space figures count the table. The subset form also needs a list of the masks in increasing popcount order, or a loop over all masks in increasing numerical order with the popcount used to check the ordering, and that list is $O(2^n)$ more entries.

The transition cost is $O(n)$ because the loop runs over the items of $S$. A standard optimization is to iterate only over the set bits of $S$, using `while (bits) { int v = __builtin_ctz(bits); bits &= bits - 1; ... }`, which makes the transition cost proportional to $|S|$ rather than to $n$, and gives a constant-factor improvement of roughly two or three.

The subset sum transform, described in the variants section, computes a different function over the same table in $O(n 2^n)$, and it is worth knowing because the table is already there.

Memory is the binding constraint more often than time is. At $n = 20$, the ordered table of 64-bit integers is $21$ million entries, or $168$ megabytes. A common workaround is to store 32-bit integers when the costs are small, which halves it, or to use the subset form when the problem allows it.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The shortest tour through $n \le 20$ cities | The ordered form, the Held-Karp construction |
| The cheapest way to assign $n$ items to bins | The subset form, when the bin is a function of the popcount |
| The number of ways to order the items so that consecutive ones are compatible | The ordered form, with a count instead of a cost |
| The number of subsets of a given size with a given property | The subset form, or the subset sum transform |
| The minimum number of bins needed, with a size limit | The subset form, with the "load of the current bin" derived from the popcount |
| $n > 24$ | A different technique: a branch and bound with a good bound, or an integer program |
| A graph with $10^5$ vertices | A graph algorithm, not a mask |
| The items are indistinguishable | Not this technique; the multiplicities are the state |
| The cost depends on the order in a non-decomposable way | The technique does not apply, and the problem is usually a search |

The last row is worth stating precisely. The traveling salesman problem on a general graph is a set problem, but the DP over sets works because the cost decomposes into a sum of edge costs. A problem where the value of a construction depends on the whole order, and not on a sum of pairwise terms, is not a bitmask DP problem even when the universe is small.

## Recursion decision

The recursive formulation of the subset problem is the natural one: a function `best(mask)` that tries adding each unused item. Its depth is the number of items, so at most $n$, which is at most about twenty-five for any problem that the technique can solve at all.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Recursive is safe, and the memo table is the real cost |
| Java | About $10^4$ frames | Recursive is safe |
| Python | The interpreter limit of $1000$ | Recursive is safe, and the limit is never reached |
| Pascal | The operating system stack | Recursive is safe |
| JavaScript | About $10^4$ frames | Recursive is safe |

So the recursion decision here is easy, and it is the exception among the techniques in this encyclopedia: the recursive form with a memo table is perfectly safe, because the depth is the size of the universe rather than the size of the state space.

Two cautions remain. The first is that the memo table in the recursive form is a hash table keyed by the mask, which is slower and uses more memory than the flat array of the iterative form; at $n = 20$ the difference is a factor of two or three in both. The second is that the recursive form is the one that finds the state by accident, and the state is the thing to get right.

The practical recommendation is therefore: use the recursive form to discover the state, and the iterative form with a flat array to submit.

## Implementation walkthrough

The transition is the whole algorithm, and the inner loop over the set bits is the part that decides whether the time limit is met.

```cpp
for (int mask = 0; mask < (1 << n); ++mask) {
    for (int bits = mask; bits; bits &= bits - 1) {
        int u = __builtin_ctz(bits);              // a city in the set
        for (int rest = ((1 << n) - 1) ^ mask; rest; rest &= rest - 1) {
            int v = __builtin_ctz(rest);          // a city not in the set
            dp[(mask | (1 << v)) * n + v] =
                min(dp[(mask | (1 << v)) * n + v], dp[mask * n + u] + cost[u][v]);
        }
    }
}
```

The `bits &= bits - 1` idiom clears the lowest set bit, so the loop visits exactly the members of the set and nothing else. It replaces a loop over all $n$ bits with a loop over the $|S|$ members, and it is the difference between $O(n^2 2^n)$ and a program that misses its time limit.

The index arithmetic is the second thing that matters.

```cpp
int index = mask * n + u;    // the flat table has 2^n * n entries
```

The multiplication is the reason the table is a flat array rather than a vector of vectors. A vector of vectors costs one allocation per mask, which at $2^{20}$ masks is a million allocations, and the extra pointer per row costs another $8$ megabytes.

The order of evaluation is the third thing. The loop over masks in increasing numerical order does **not** compute the states in increasing popcount order, and for the forward transition `dp[mask | (1<<v)]` the target mask is always numerically larger than the source mask, because setting a bit increases the number. So the forward transition is safe with the increasing-numerical-mask loop. The backward transition, which reads `dp[mask without a bit]`, is also safe for the same reason, because removing a set bit always decreases the number.

The one thing that is **not** safe is a transition that both adds and removes bits, and there is none here.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Storing only one value per set in the traveling salesman | The answer is wrong; the cost depends on the last city | Use the ordered form, or make the problem satisfy the subset property |
| Forgetting the return edge to the start | The answer is the cost of an open path | Charge $c_{\text{end}}$ at the terminal state |
| Using `1 << n` with $n \ge 32$ | Undefined behavior or a negative shift in C and C++ | Use a 64-bit mask and keep $n \le 30$ |
| Iterating over all $n$ bits instead of the set bits | Two or three times slower than necessary | Use the `bits &= bits - 1` idiom |
| Allocating a vector per mask | A million allocations and eight extra megabytes | Use one flat array |
| Writing the update before reading the state | The state is read after it has been overwritten | Read the source into a local first |
| Confusing `mask & (1 << v)` with `mask >> v & 1` | Both are membership tests, but the precedence of `&` and `<<` catches people | Parenthesize |
| Forgetting that $f[\{u\}][u]$ is the cost from the start | The whole table is shifted | Initialize the singletons explicitly |
| Assuming the item order does not matter | Wrong for any problem with an order-dependent value | Check the subset property before choosing the form |

### Why this fails: the set without the last city

The plausible wrong approach is to use the plain subset form for the traveling salesman, on the reasoning that the set of visited cities is enough, and that the city the van is in is "obviously" determined.

It is not. The cost of the next move depends on where the van is, and the set of visited cities does not say where the van is.

The smallest counterexample is a three-city instance. Take the cities $0$, $1$, $2$, with the directed costs

| From \ To | 0   | 1   | 2   |
| --------- | --- | --- | --- |
| 0         | 0   | 1   | 1   |
| 1         | 10  | 0   | 1   |
| 2         | 1   | 10  | 0   |

and a tour that starts at $0$ and returns to $0$. The two possible tours are $0 \to 1 \to 2 \to 0$ with cost $1 + 1 + 1 = 3$ and $0 \to 2 \to 1 \to 0$ with cost $1 + 10 + 10 = 21$, so the optimum is $3$.

The set-only program computes $f[\{0,1\}] = \min(c(0,1), c(1,0)) = \min(1, 10) = 1$ and $f[\{0,2\}] = \min(c(0,2), c(2,0)) = \min(1, 1) = 1$. Then it computes $f[\{0,1,2\}] = \min(f[\{0,1\}] + c(2,0),\ f[\{0,2\}] + c(1,0)) = \min(1 + 1,\ 1 + 10) = 2$.

The program reports $2$. The optimum is $3$, and no tour of cost $2$ exists.

The mechanism is exact, and it is about a missing edge rather than about a wrong one. The tour $0 \to 1 \to 2 \to 0$ has three edges: $0 \to 1$, $1 \to 2$, and $2 \to 0$. The set-only recurrence accounts for the first of them, inside $f[\{0,1\}] = 1$, and for the third of them, in the closing term $c(2, 0) = 1$. It never accounts for the second, the edge from $1$ to $2$, because the state does not say that the van is at city $1$, so there is no way to charge for leaving it. The value $2$ is the cost of the tour with the middle edge omitted.

So the failure is not that the program confuses two different routes for the same set. It is that the state is missing the piece of information that the price of the next edge depends on, and the price that goes missing is one whole edge.

The fix is the ordered form, where the state is $(S, u)$. There the value $f[\{0,1\}][1] = 1$ is stored separately from $f[\{0,1\}][0] = 10$, and the transition from $\{0,1\}$ to $\{0,1,2\}$ charges the edge $1 \to 2$ explicitly, giving $1 + 1 + 1 = 3$.

The lesson generalizes: **before collapsing a state, check that the future cannot distinguish the collapsed cases.** The set of visited cities and the current city are not interchangeable, and the set-only form is correct only for problems that genuinely satisfy the subset property.

## Variants and extensions

- **The subset sum transform.** Given a function $g$ on masks, compute $h[S] = \sum_{T \subseteq S} g[T]$ in $O(n 2^n)$ time with one pass per bit. It answers "how many subsets of $S$ have property $g$" in one table pass, and it is the standard tool for the "count the subsets with a given sum" problems.
- **Counting instead of minimizing.** The transition becomes an addition and the state becomes a count, which answers "how many tours" and "how many orderings".
- **Modulo.** Every count can be taken modulo a prime, which is what makes the counting variants feasible at $n = 20$.
- **The meet in the middle.** For $n$ around $30$, split the items into two halves, compute the DP for each half, and combine. It costs about $O(n 2^{n/2})$ space and is the standard escape from the $2^n$ wall.
- **The directed acyclic graph over subsets.** Adding a bit always increases the mask, so the subsets form a dag under the relation of inclusion, and the DP is a longest-path computation on that dag. This is the connection to [dynamic programming on a directed acyclic graph](/algorithms/dynamic-programming/dag-dp).
- **A branch and bound with the mask as a lower bound.** When $n$ is too large for the full table, a search with a good lower bound, such as the sum of the cheapest outgoing edge of each unvisited city, can solve instances that the table cannot.
- **Coloring and covering.** A proper coloring of a small graph is a partition into independent sets, and the standard dynamic program over masks counts the colorings by choosing the independent sets one at a time.

## Contest strategy

1. Count the items before writing anything. Above twenty-four, the flat table is out, and the problem needs a different idea.
2. Write down the state as a pair of words: what does the future need to know? If the answer mentions the current position, the state is a pair, and the table is $n$ times bigger.
3. Write the base cases explicitly. For the ordered form they are the singletons, and the cost from the start is the value that is most often forgotten.
4. Decide where the terminal cost goes. Charging the return edge at the end is clearer than allowing it as a transition.
5. Write the brute-force version first for $n \le 6$ and keep it. A disagreement between the two on a random six-city instance is the fastest way to find a broken transition.
6. Use the set-bit iteration. The difference between iterating over the members of the set and iterating over all the bits is a constant factor of two or three, and at $n = 20$ that is the difference between passing and failing.
7. Use one flat array. A vector of vectors at $2^{20}$ masks is a million allocations.
8. Check the width of the mask. `1 << n` is undefined in C and C++ for $n \ge 32$, and a shift by $31$ on a signed integer is already the edge of what the standard guarantees.

## Worked problems

### Problem 1: the delivery tour

**Restatement.** There are $n \le 20$ cities and a directed distance matrix. A tour starts at city $0$, visits every other city exactly once, and returns to city $0$. Report the minimum tour cost.

**Naive baseline.** Enumerate the $(n-1)!$ orderings, which is $1.2 \times 10^{17}$ at $n = 20$.

**Insight.** The set of visited cities and the current city determine the future, so the state is a pair.

**Derivation.** Compute $f[S][u]$ in increasing popcount order. Initialize $f[\{u\}][u] = c(0, u)$ for every $u \ne 0$, and $f[\{0\}][0] = 0$. For each state and each $v \notin S$, update $f[S \cup \{v\}][v]$. The answer is $\min_u (f[U][u] + c(u, 0))$.

**Correctness.** The induction on $|S|$ in the correctness proof shows that every state holds the true optimum for its set and its endpoint, and that the terminal minimum is the optimal tour.

**Complexity.** $O(n^2 2^n)$ time and $O(n 2^n)$ space. At $n = 20$ that is about $21$ million states and $4 \times 10^8$ transitions, which is a few seconds in C++ with the set-bit iteration.

**Common wrong approach.** Using the subset form, which reports a cost that no tour achieves, as the three-city counterexample in the common mistakes section shows.

### Problem 2: the seminar rooms

**Restatement.** There are $n \le 20$ students and $k$ rooms, each holding at most $c$ students. Every student goes to exactly one room, and the rooms are filled one after another, so the students in a room form a consecutive block of the ordering. Report the number of ways to assign the students.

**Naive baseline.** Enumerate the assignments, which is $k^n$ at worst.

**Insight.** The state is the set of students already assigned, and the room being filled and the load in it are both functions of the popcount: the number of full rooms is $\lfloor \operatorname{pc}(S) / c \rfloor$ and the load in the current room is $\operatorname{pc}(S) \bmod c$. The state is therefore a single mask, and the table is $2^n$ rather than $n 2^n$.

**Derivation.** Let $f[S]$ be the number of ways to assign the students of $S$, having filled the rooms in order. The base case is $f[\varnothing] = 1$. For each student $v \notin S$, add $f[S \cup \{v\}] \mathrel{+}= f[S]$, provided the current room is not already full. The answer is $f[U]$, which is nonzero exactly when $kc \ge n$.

**Correctness.** Every assignment of a set of students to consecutive rooms determines a unique order in which the students were placed, and the program's transitions follow that order one student at a time. Since the room index and the load are determined by the popcount, the state carries everything the transition needs, and the counting is exact.

**Complexity.** $O(n 2^n)$ time and $O(2^n)$ space, which at $n = 20$ is a million states. That is a factor of $n$ less than the traveling salesman problem, and it is the reason to check the subset property before choosing a form.

**Common wrong approach.** Assuming the state must include the room, which makes the table $n$ times bigger for no reason, and which is the mistake the derivation above exists to prevent.

### Problem 3: counting the cycles

**Restatement.** There are $n \le 20$ cities and a directed graph in which each city has an outgoing edge to every other city, with a cost. Report the number of Hamiltonian cycles through all $n$ cities, modulo $10^9 + 7$, counting a cycle and its rotations as the same cycle.

**Naive baseline.** Enumerate the $(n-1)!$ orderings and count the cycles, which is $1.2 \times 10^{17}$ at $n = 20$.

**Insight.** The same recurrence counts instead of minimizing, and the rotation is removed by fixing the starting city.

**Derivation.** Fix city $0$ as the start. Compute $f[S][u]$, the number of paths that start at $0$, use exactly the cities of $S$, and end at $u$, with $f[\{u\}][u] = 1$ for $u \ne 0$ and $f[\{0\}][0] = 1$. The transition is $f[S \cup \{v\}][v] \mathrel{+}= f[S][u]$ for every $v \notin S$. The answer is $\sum_{u} f[U][u]$, reduced modulo $10^9 + 7$, because a path that starts at $0$ and returns to $0$ is a cycle, and fixing the start removes the rotational duplication.

**Correctness.** The same induction as the first problem applies with additions in place of minima: every path on $S$ ending at $v$ is obtained uniquely by removing $v$ and appending it to a path on $S \setminus \{v\}$ ending at some $u$. Since the start is fixed, each cycle is counted once, up to the choice of its direction of traversal, which the problem either treats as the same cycle or not.

**Complexity.** $O(n^2 2^n)$ time and $O(n 2^n)$ space, with every addition reduced modulo $10^9 + 7$. A count that is not reduced overflows immediately.

**Common wrong approach.** Counting the rotations as different cycles, by not fixing the starting city, which multiplies the answer by $n$ and is the most common off-by-a-factor in this family.

## Practice progression

1. **Recognition.** Given a statement, count the items and decide whether the state is a set or a pair of a set and a position. Write the state down in words before writing any code.
2. **Direct application.** Implement the ordered form for the traveling salesman on up to eight cities, and check it against the brute-force permutation search.
3. **Adaptation.** Write the subset form for a problem that satisfies the subset property, and write the counting version of both forms, reduced modulo a prime.
4. **Combination.** Combine the mask with a second technique: a mask with a Fenwick tree for a prefix query, or a mask with a topological order for a scheduling problem over subsets.
5. **Challenge.** Solve a traveling salesman instance with $n = 24$ in C++ using a flat array of 32-bit integers, and measure the memory against the limit.
6. **Transfer.** Recognize the set of states as a directed acyclic graph, and solve the same instance as a longest-path problem over the subsets, using the machinery of the [DAG dynamic program](/algorithms/dynamic-programming/dag-dp).

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What is the subset property, and what does it buy? (Formal model)
2. Why does the traveling salesman need the pair state rather than the set state? (Formal model)
3. State the recurrence for the ordered form and the base cases. (Algorithm derivation)
4. How many table entries does the ordered form need at $n = 20$, and how much memory is that? (Complexity analysis)
5. What is the smallest counterexample that breaks the set-only form, and what does the buggy program report? (Common mistakes)
6. Why is the tour cost reported as $2$ by the set-only program on the three-city instance, when no tour costs $2$? (Common mistakes)
7. Why must the terminal cost be added after the last city, rather than as an ordinary transition? (Algorithm derivation)
8. What does the set-bit iteration buy, and how is it written? (Implementation walkthrough)
9. Why is the increasing-numerical-mask loop safe for the forward transition? (Implementation walkthrough)
10. What is the subset sum transform, and what does it compute in $O(n 2^n)$? (Variants and extensions)
11. Which constraint value rules the whole technique out? (Recognition patterns)

## Further reading

- The subject index lists this technique, [bitmask dynamic programming](/algorithms/dynamic-programming/bitmask-dp), beside the other dynamic programs in the encyclopedia.
- The set of states is a directed acyclic graph under inclusion, which is the connection to [dynamic programming on a directed acyclic graph](/algorithms/dynamic-programming/dag-dp).
- The search over the subsets that this technique replaces is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The tree of choices that the search version explores is in [backtracking](/algorithms/enumeration/backtracking).
- The graph representation that a distance matrix overrides, and the difference between a matrix and an adjacency list, are covered in [graph representation](/algorithms/graphs/representation).
- The subset sum transform is the same idea as a sum over a [Fenwick tree](/algorithms/range-queries/fenwick-tree) over a prefix, applied to a set of bits rather than to a prefix of an array.
- The bit representation that the mask encoding relies on is in [binary representation](/algorithms/foundations/binary-representation).
- The counting that a bitmask program does modulo a prime, and the arithmetic behind it, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
