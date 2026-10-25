---
id: greedy.matroid-perspective
title: The matroid perspective
summary: Recognize when a greedy rule is optimal by checking that the feasible sets form a matroid, and use the exchange property to justify sorting by weight.
division: [gold, platinum]
subjects: [greedy]
level: advanced
importance: advanced-technique
keywords:
    [
        matroid,
        partition matroid,
        independence system,
        exchange property,
        greedy,
        maximum weight basis,
        graphic matroid,
        scheduling matroid,
        linear matroid,
        kruskal,
    ]
prerequisites:
    required: [foundations.sorting, foundations.complexity]
    recommended:
        [
            greedy.interval-scheduling,
            greedy.scheduling-deadlines-and-release-times,
            graphs.mst,
            advanced.xor-bases,
        ]
complexity:
    time: "O(n log n)"
    space: "O(n)"
assumptions:
    - The items are partitioned into color classes, and a set is feasible when it contains at most one item from each class.
    - Every weight is a nonnegative integer, and the objective is the total weight of the chosen set.
    - Ties in weight may be broken arbitrarily, because only the total matters.
implementations: greedy.matroid-perspective
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/greedy.matroid-perspective.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

A matroid is the structure that makes a greedy algorithm provably correct. It is an independence system with one extra axiom, the **exchange property**, and that axiom is exactly what an exchange argument needs. When the feasible sets of a problem form a matroid, sorting the items by weight and taking every item that keeps the set feasible returns a maximum-weight feasible set. No problem-specific search, no dynamic program, and no case analysis is required.

The smallest useful example is a **partition matroid**. The items are split into color classes, and a set is feasible when it contains at most one item of each color. The greedy rule is to sort all items by weight in descending order and take an item whenever its color has not been taken yet. The exchange property holds for a simple reason: two feasible sets with different sizes must occupy different numbers of color classes, so a class used by the larger set is free in the smaller one. The article proves that this is a matroid, proves that the sorted greedy is optimal, and then shows the same argument in three other matroids: forests in a graph, unit jobs with deadlines, and linearly independent vectors over $GF(2)$.

The perspective matters because it explains why some greedy rules work and others do not. A rule that sorts by weight is correct on a matroid and can fail on a structure that merely looks similar. The moment a budget, a matching constraint, or two simultaneous quotas enter the problem, the exchange property can break, and the article gives explicit counterexamples.

The cost is one sort, $O(n \log n)$ time and $O(n)$ space. For a partition matroid the same answer can be computed by taking the maximum weight in each color class, which is an $O(n)$ scan with a hash map or an $O(n \log n)$ sort by color. The sorted-by-weight scan is the version that generalizes; the reference programs implement the same selection in grouped form.

## Problem motivation

A collector is shopping at a festival. Every booth sells items in one of several colors, the collector wants at most one item of each color, and every item has a value. The collector has a bag and no budget limit, so the only rule is the color rule. The question is which items to buy to maximize the total value.

The constraints:

- $1 \le n \le 200\,000$ items.
- Each item has an integer color $c_i$ with $1 \le c_i \le 10^9$ and an integer weight $w_i$ with $0 \le w_i \le 10^9$.
- A selection is feasible when it contains at most one item of each color.
- The total weight of a feasible selection is the sum of the weights of its items, and the task is to maximize that sum.

The color labels are large, so they cannot be used as array indices. There may be many items of the same color, and many colors may have only one item. The number of feasible selections is the product of the terms $|E_j| + 1$, which is exponential, so enumeration is hopeless.

The same shape appears whenever a resource is partitioned into disjoint groups and each group can contribute at most one item: choosing one dish from each cuisine under a value score, choosing one candidate per department, choosing one version of each package, or choosing one representative from each category of a dataset. The weighted version of the problem is the canonical maximum-weight independent set in a partition matroid.

## Recognition patterns

The matroid perspective applies when all of the following hold.

- The ground set is finite and every item can be chosen or skipped.
- Feasibility is **hereditary**: removing an item from a feasible set keeps it feasible.
- The **exchange property** holds: whenever $A$ and $B$ are feasible and $|A| < |B|$, some item of $B \setminus A$ can be added to $A$ while keeping it feasible.
- The objective is additive: the value of a set is the sum of the values of its items.
- There are no additional constraints outside the matroid family, such as a budget, and no second matroid constraint, such as a matching on top of the partition.

The phrases that signal a partition matroid are "at most one per color", "one per category", "one representative from each group", "no two items of the same type", and "choose one version of each package". The phrase that rules the technique out is "and the total cost must be at most $B$", because a budget turns the feasible sets into a knapsack instance, which is not a matroid.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| At most one item per color | Rules in a partition matroid |
| At most $b_j$ items of color $j$ | Still a partition matroid, with a capacity per class |
| Nested quotas, such as at most 2 from a group and at most 5 overall | A laminar matroid, and the same greedy works |
| One item per color, and one item per row of a matrix | The intersection of two matroids, not a matroid |
| A total budget on the weights | 0/1 knapsack, not a matroid |
| A graph whose chosen edges must stay acyclic | A graphic matroid, and Kruskal is the greedy |
| Unit jobs with deadlines | A scheduling matroid |
| Vectors that must stay linearly independent | A linear matroid |
| Items arrive online and must be accepted immediately | The matroid secretary problem, not this scan |

## Naive approach

The baseline is to enumerate every subset and test the color rule.

```python
best = 0
for mask in range(1 << n):
    seen = set()
    total = 0
    ok = True
    for i in range(n):
        if mask & (1 << i):
            if colors[i] in seen:
                ok = False
                break
            seen.add(colors[i])
            total += weights[i]
    if ok:
        best = max(best, total)
```

This is $O(n 2^n)$ and returns the correct answer, so it is a specification of the problem rather than a solution. For $n = 200\,000$ it cannot finish.

A second baseline is the greedy rule applied in the wrong order. Taking the first item of each color as it appears in the input is plausible and wrong. Consider the input order

| Item | Color | Weight |
| ---- | ----- | ------ |
| A    | red   | 1      |
| B    | blue  | 5      |
| C    | red   | 9      |

The first-item rule takes A and B for a total of 6. The optimum is B and C for a total of 14. The rule never compared A with the later red item, so it could not know that C was worth more. Sorting by weight is what fixes the comparison.

## Key insight

The insight is that the color rule makes the classes independent of each other. A choice in one color class consumes no capacity in any other class, so the only competition is inside a single class, and inside a class the answer is obvious: take the heaviest item. The global greedy reaches the same choice by considering the heaviest items first, and the exchange property explains why this local rule is safe in general.

For a partition matroid, the exchange argument is almost a one-liner. Because weights are nonnegative, an optimal selection can be assumed to be a basis: it takes one item from every nonempty color class, and adding a missing zero-weight item does not lower the total. Suppose such an optimal selection uses some item $x$ of color $j$. The greedy selection takes the heaviest item of that color, whose weight is at least $w(x)$. Replacing $x$ by that heavier item keeps the selection feasible, because the color class still contributes exactly one item. Repeating this replacement for every color turns the optimal basis into the greedy selection without lowering the total. Therefore the greedy selection is optimal.

The general matroid theorem is the same idea with the color classes replaced by the exchange axiom. It says that the greedy prefix can always be extended to an optimal basis, and the exchange axiom is the step that performs the replacement. The invariant below is the exact statement that survives the induction.

::: math invariant Invariant
After the sorted scan has processed a prefix of the items, the chosen set is a maximum-weight independent subset of that prefix. When the scan finishes, it is a maximum-weight basis of the whole matroid.
:::

The invariant is what makes the algorithm more than a heuristic. It is proved in the correctness section.

## Visual intuition

Draw the color classes as rows, with the items of each row sorted by weight from left to right.

```text
color 1:  [9] [5] [1]
color 2:  [8] [4]
color 3:  [7] [2]
```

The global greedy reads the weights in the order 9, 8, 7, 5, 4, 2, 1. It takes 9 for color 1, 8 for color 2, and 7 for color 3. Every later item belongs to a row whose leftmost cell has already been taken, so every later item is skipped. The chosen cells are the three leftmost cells, one per row.

The picture to hold is a set of buckets, one per color. An item is a ball with a weight written on it. The greedy tips the balls onto a table in decreasing order of weight and drops each ball into its bucket if the bucket is empty; if the bucket already holds a ball, the new ball rolls away. The heaviest ball in each bucket is the one that stays.

The exchange property is the statement that the order in which the buckets are visited does not matter. If a lighter ball is already in a bucket and a heavier ball of the same color arrives later in some other ordering, the heavier ball can replace it without violating the rule. That replacement is the exchange.

## Formal model

Let $E$ be a finite set of items, and let $\mathcal{I}$ be a family of subsets of $E$.

::: math definition Definition
The pair $(E, \mathcal{I})$ is an **independence system** when

1. $\emptyset \in \mathcal{I}$, and
2. $\mathcal{I}$ is hereditary: if $A \in \mathcal{I}$ and $B \subseteq A$, then $B \in \mathcal{I}$.

The sets in $\mathcal{I}$ are called **independent**.
:::

::: math definition Definition
An independence system $(E, \mathcal{I})$ is a **matroid** when it also satisfies the **exchange property**: for every $A, B \in \mathcal{I}$ with $|A| < |B|$, there is an element $e \in B \setminus A$ such that $A \cup \{e\} \in \mathcal{I}$.
:::

::: math definition Definition
Let $E = E_1 \sqcup E_2 \sqcup \cdots \sqcup E_m$ be a partition of $E$ into color classes. The **partition matroid** has

$$
\mathcal{I} = \left\{ I \subseteq E : |I \cap E_j| \le 1 \text{ for every } j \right\}.
$$

A **basis** is a maximal independent set, and the **rank** $r(A)$ is the size of the largest independent subset of $A$.
:::

::: math definition Definition
For a weight function $w : E \to \mathbb{Z}_{\ge 0}$, the weight of a set is $w(I) = \sum_{e \in I} w(e)$. The **greedy algorithm** sorts $E$ so that $w(e_1) \ge w(e_2) \ge \cdots \ge w(e_n)$, starts with $G = \emptyset$, and for each $e_i$ in that order adds $e_i$ to $G$ when $G \cup \{e_i\}$ is independent.
:::

::: math definition Definition
A **circuit** is a minimal dependent set. In a matroid, for a basis $B$ and an element $x \notin B$, the set $B \cup \{x\}$ contains exactly one circuit, written $C(x, B)$, and that circuit contains $x$.
:::

::: math lemma Lemma
The partition matroid satisfies the exchange property.
:::

The lemma is proved in the correctness section. It is the only structural fact the algorithm needs.

## Algorithm derivation

The state is a set of colors that have already contributed an item, and the total weight of the chosen items.

The update rule is: take the next item in decreasing order of weight, and accept it exactly when its color is not in the used set. When an item is accepted, mark its color and add its weight to the total. When an item is rejected, do nothing, because the color class is already represented by a heavier item.

The algorithm in its direct form:

```text
sort items by weight descending
total = 0
used = empty set
for (color, weight) in items:
    if color not in used:
        used.add(color)
        total += weight
return total
```

The scan is one pass because the sorted order is fixed before the scan begins. The set `used` only grows, and each item is examined once.

The same answer has a grouped form. Because the classes are disjoint, the greedy selection is exactly the heaviest item of every nonempty class. Sort the items by color ascending and, inside each color, by weight descending, then take the first item of every color.

```text
sort items by (color ascending, weight descending)
total = 0
previous = none
for (color, weight) in items:
    if color != previous:
        total += weight
        previous = color
return total
```

The grouped form needs no hash set and no membership test. It is the form used by the reference implementations, and the reference section explains why it produces the same selection.

::: math invariant Invariant
After the first $k$ items in the sorted order, `total` is the maximum weight of an independent subset of those $k$ items. In the grouped form, after each completed color class, `total` includes the maximum weight of that class and no other item of it.
:::

The invariant is preserved by both forms. In the direct form it is the matroid theorem applied to the prefix. In the grouped form it is the observation that the first item of a sorted color class is its maximum, and that different classes do not interact.

## Step-by-step execution

Take seven items in three colors.

| Item | Color | Weight |
| ---- | ----- | ------ |
| A    | red   | 5      |
| B    | blue  | 4      |
| C    | red   | 9      |
| D    | green | 7      |
| E    | blue  | 8      |
| F    | green | 2      |
| G    | red   | 1      |

Sorted by weight descending, the order is C (9, red), E (8, blue), D (7, green), A (5, red), B (4, blue), F (2, green), G (1, red).

| Step | Item | Color | Weight | Color free? | Action | Total |
| ---- | ---- | ----- | ------ | ----------- | ------ | ----- |
| 1    | C    | red   | 9      | yes         | take   | 9     |
| 2    | E    | blue  | 8      | yes         | take   | 17    |
| 3    | D    | green | 7      | yes         | take   | 24    |
| 4    | A    | red   | 5      | no          | skip   | 24    |
| 5    | B    | blue  | 4      | no          | skip   | 24    |
| 6    | F    | green | 2      | no          | skip   | 24    |
| 7    | G    | red   | 1      | no          | skip   | 24    |

The chosen set is C, E, and D, with total 24. The grouped form sorts by color and then by weight descending:

| Color | Items in order | First item | Contribution |
| ----- | -------------- | ---------- | ------------ |
| red   | 9, 5, 1        | C          | 9            |
| blue  | 8, 4           | E          | 8            |
| green | 7, 2           | D          | 7            |

The total is again 24. The two forms agree on the chosen items, not merely on the total.

A tie is worth checking. If two items of different colors both weigh 9, the direct scan takes both, in either order. If two items of the same color both weigh 9, the direct scan takes the first one and skips the second, and the grouped form takes either one; the total is the same, and the problem asks only for the total.

## Correctness proof

::: math lemma Lemma
The partition matroid satisfies the exchange property.
:::

::: math proof Proof
Let $A$ and $B$ be independent sets with $|A| < |B|$. Let $S_A$ be the set of color classes that contain an item of $A$, and define $S_B$ similarly. Because $A$ is independent, it contains at most one item from each class, so $|S_A| = |A|$. Likewise $|S_B| = |B|$. Therefore $|S_A| < |S_B|$, and some color class $j$ belongs to $S_B$ but not to $S_A$.

Choose an item $e \in B \cap E_j$. That intersection is nonempty because $j \in S_B$. The set $A \cup \{e\}$ contains one item of class $j$, since $j \notin S_A$, and it still contains at most one item of every other class, since $A$ did and $e$ belongs only to class $j$. Therefore $A \cup \{e\}$ is independent. This is exactly the exchange property. $\square$
:::

::: math theorem Theorem
The partition matroid with nonnegative weights has a maximum-weight independent set that is found by sorting the items by weight in descending order and taking each item whose color is still free.
:::

::: math proof Proof
Let $G$ be the greedy selection. For each color class $E_j$, let $m_j = \max \{ w(e) : e \in E_j \}$, with $m_j = 0$ when the class is empty. The greedy scan always takes the first item of a class that it encounters, and because the scan is in descending weight order, that first item has weight $m_j$. It never takes a second item of the same class, because the class is then marked. Hence

$$
w(G) = \sum_{j=1}^{m} m_j.
$$

Now let $O$ be any independent set. It contains at most one item of each class, so its contribution from class $j$ is either $0$ or the weight of one of its items, and that weight is at most $m_j$. Therefore

$$
w(O) \le \sum_{j=1}^{m} m_j = w(G).
$$

Since $O$ was arbitrary, $G$ is optimal. $\square$
:::

The direct proof is short because the partition matroid is simple. The general theorem is what transfers the argument to other matroids, and its proof uses the exchange property through the unique-circuit fact.

::: math lemma Lemma
In a matroid, if $B$ is a basis and $x \notin B$, then $B \cup \{x\}$ contains exactly one circuit, and that circuit contains $x$.
:::

The lemma is the standard circuit characterization of matroids. It is what licenses the replacement $O_i \cup \{e_{i+1}\} \setminus \{y\}$ in the proof below.

::: math theorem Theorem
Let $M = (E, \mathcal{I})$ be a matroid with nonnegative weights. Sort $E$ so that $w(e_1) \ge \cdots \ge w(e_n)$, and let $G_i$ be the greedy set after the first $i$ items. Then $G_n$ is a maximum-weight basis of $M$.
:::

::: math proof Proof
We prove the stronger invariant: for every $i$, there is a maximum-weight basis $O_i$ such that

$$
G_i \subseteq O_i \quad \text{and} \quad O_i \setminus G_i \subseteq \{e_{i+1}, \ldots, e_n\}.
$$

For $i = 0$, take any maximum-weight basis. Suppose the invariant holds for $i$.

If $G_{i+1} = G_i$, the item $e_{i+1}$ was rejected, and $O_{i+1} = O_i$ still satisfies the invariant.

If $G_{i+1} = G_i \cup \{e_{i+1}\}$ and $e_{i+1} \in O_i$, again $O_{i+1} = O_i$ works.

The remaining case is that $e_{i+1}$ was accepted but does not belong to $O_i$. Since $O_i$ is a basis and $e_{i+1} \notin O_i$, the set $O_i \cup \{e_{i+1}\}$ contains a unique circuit $C$. Choose $y \in C \setminus \{e_{i+1}\}$ and set

$$
O_{i+1} = O_i \cup \{e_{i+1}\} \setminus \{y\}.
$$

Replacing an element of the unique circuit by the new element gives another basis. Since $e_{i+1}$ was accepted, $G_i \cup \{e_{i+1}\}$ is independent, so the circuit $C$ is not contained in $G_i \cup \{e_{i+1}\}$. In particular $y \notin G_i$, and therefore $y \in O_i \setminus G_i$. By the invariant, every element of $O_i \setminus G_i$ lies in $\{e_{i+1}, \ldots, e_n\}$. The element $y$ is one of them and is not $e_{i+1}$, so $y \in \{e_{i+2}, \ldots, e_n\}$. The weights are sorted in non-increasing order, so $w(y) \le w(e_{i+1})$. Hence $w(O_{i+1}) \ge w(O_i)$, and since $O_i$ is maximum-weight, $O_{i+1}$ is maximum-weight as well. It contains $G_{i+1}$, and its remaining elements lie in $\{e_{i+2}, \ldots, e_n\}$.

At the end, $G_n \subseteq O_n$. The greedy set is maximal: if some item $e$ could be added to $G_n$, then it was independent of the greedy set at the moment it was scanned, because the later greedy set contains that earlier set, and independence is hereditary. So $G_n$ would have accepted it. Therefore $G_n$ is a basis. All bases of a matroid have the same size, so $G_n = O_n$, and $G_n$ is a maximum-weight basis. $\square$
:::

## Complexity analysis

**Time: $O(n \log n)$**, dominated by the sort. The scan is $O(n)$ in the direct form and $O(n)$ in the grouped form. A hash set gives expected $O(1)$ membership per item, so the scan does not change the bound.

**Time: $O(n)$** when the items are already grouped by color and sorted inside each group, or when the colors are small integers and the maximum per color can be maintained in an array. The general technique still needs a sort unless the input provides one.

**Auxiliary space: $O(n)$** for the array of items and, in the direct form, the set of used colors. The grouped form needs only the item array and two scalar variables, so it uses $O(1)$ extra space beyond the input.

::: math complexity Complexity
The matroid greedy: $O(n \log n)$ time for the sort and $O(n)$ for the scan, so $O(n \log n)$ in total. $O(n)$ space for the items, or $O(1)$ extra space in the grouped form.
:::

The 64-bit detail is not part of the asymptotic bound but it is part of the implementation bound. With $n = 200\,000$ and $w_i \le 10^9$, the total can reach $2 \cdot 10^{14}$, which exceeds a signed 32-bit integer. C, C++, and Java need a 64-bit accumulator. Python integers are unbounded. JavaScript `Number` is exact up to $2^{53}$, and $2 \cdot 10^{14}$ is well below that limit.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| At most one item per color, maximize the total weight | The partition matroid greedy |
| Exactly one item per color, with every color nonempty | The same greedy; the answer takes one from each class |
| At most $b_j$ items of color $j$ | A partition matroid with capacities; the same sorted scan |
| Nested quotas, such as a group limit and a global limit | A laminar matroid; the same sorted scan |
| A total budget on the item weights | 0/1 knapsack, not a matroid |
| One item per color and one item per row | The intersection of two matroids, usually a matching |
| Maximum-weight spanning forest | The graphic matroid, with Kruskal's algorithm |
| Unit jobs with deadlines and profits | The scheduling matroid, with a latest-free-slot assignment |
| Maximum-weight linearly independent set of vectors | A linear matroid, with an XOR basis |
| Matchable subsets of one side of a bipartite graph | A transversal matroid; cardinality by augmenting paths |
| Minimum-weight basis | Sort ascending instead of descending |
| Negative weights and "at most one" | Skip negative items; the basis theorem assumes nonnegative weights |

The budget row is the one that catches people. The feasible sets of a knapsack are hereditary, so the problem looks like an independence system, and a greedy rule that sorts by value looks reasonable. The exchange property fails, and so does the greedy. The counterexample is in the next section.

## Reference implementations

The manifest publishes one `program` variant per language, and all six solve exactly the stated problem: read $n$, read $n$ pairs of color and weight, and print the maximum total weight of a set containing at most one item of each color.

- `c/program.c` reads with `scanf`, sorts with `qsort` and a three-way comparator, scans the sorted array, and prints a `long long` total.
- `cpp17/program.cpp` uses `std::sort` with a lambda that orders by color and then by descending weight, and one range loop.
- `java/Main.java` uses a byte-oriented scanner, `Arrays.sort` with a comparator over a small `Item` class, and a `long` total.
- `python/program.py` reads all tokens at once, sorts a list of tuples, and sums the first item of each color.
- `pascal/program.pas` uses an iterative bottom-up merge sort, `Int64` arithmetic, `SysUtils`, and one argument per `Read`, so it compiles under pas2js.
- `javascript/program.js` sorts with a numeric comparator and uses `Number` arithmetic, which is exact for the stated bounds.

The input and output contract is the same in every language. The first line contains $n$, each of the next $n$ lines contains a color and a weight, and the output is one line holding the total. Whitespace is interchangeable, so the programs read token by token rather than line by line. No trailing space is printed, and the line ends with a newline.

All six programs use the grouped form rather than the direct weight-descending scan. They sort by color ascending and, inside each color, by weight descending, then add the weight of the first item of every color. This is the same greedy selection: the first item of a color class in that order is the heaviest item of the class, and the direct scan also takes exactly the heaviest item of every class. The grouped form is shorter, needs no hash set, and avoids the large color labels entirely, because the colors are only compared with each other and never used as indices.

The canonical core is small.

```cpp
std::sort(items.begin(), items.end(), [](const Item &a, const Item &b) {
    if (a.color != b.color) {
        return a.color < b.color;
    }
    return a.weight > b.weight;
});

long long total = 0;
bool first = true;
long long previous = 0;
for (const Item &item : items) {
    if (first || item.color != previous) {
        total += item.weight;
        previous = item.color;
        first = false;
    }
}
```

The direct form is the one to remember for the proof.

```python
items.sort(key=lambda item: (-item[1], item[0]))
used = set()
total = 0
for color, weight in items:
    if color not in used:
        used.add(color)
        total += weight
print(total)
```

The two forms produce the same total. When the heaviest item of each color is unique, they also select exactly the same items; when several items of one color tie for the maximum, the forms may pick different items of the same weight. That distinction matters when adapting the code to a problem that asks which items were chosen.

## Recursion decision

The algorithm is iterative in every language. There is no recursive helper to write, and adding one would only move the same loop onto the call stack.

The sort may recurse internally. The C library `qsort`, C++ `std::sort`, Java `Arrays.sort`, Python `list.sort`, and JavaScript `Array.prototype.sort` all choose their own strategies, and their recursion depth is logarithmic in practice. The Pascal version uses an iterative bottom-up merge sort so that the published listing has no recursion at all and is easy to compile under pas2js.

| Language | Sort used | Recursion | Verdict |
| --- | --- | --- | --- |
| C | `qsort` | Internal, implementation-defined | Fine; the comparator is the only code to review |
| C++ | `std::sort` | Introsort, $O(\log n)$ depth | Fine |
| Java | `Arrays.sort` | Timsort, $O(\log n)$ depth | Fine |
| Python | `list.sort` | Timsort, $O(\log n)$ depth | Fine |
| Pascal | Bottom-up merge sort | None | Fine under pas2js |
| JavaScript | `Array.prototype.sort` | Engine-defined, $O(\log n)$ depth | Fine; the comparator must be numeric |

The merge sort in the Pascal version is the only place where a second array of the same size is allocated. That is $O(n)$ auxiliary space, which matches the item array and does not change the bound.

## Implementation walkthrough

Three details decide whether the implementation matches the statement.

**The comparator.** Sort by color ascending and then by weight descending. The color order groups the classes, and the weight order puts the maximum of each class first. A comparator that sorts only by color and leaves the weights in input order takes an arbitrary item of each class, which is wrong. A comparator that sorts only by weight loses the grouping.

**The first-of-color scan.** Keep the previous color and a boolean that says whether any color has been seen. When the color changes, add the current weight. Do not add the weight when the color is the same, even if the weight is larger; the sort guarantees that the first item is the largest. The boolean avoids relying on a sentinel color, so the code works even if the input uses color $0$.

**The accumulator width.** Use a signed 64-bit integer in C, C++, and Java. The total can reach $2 \cdot 10^{14}$, so a 32-bit type overflows long before the input limits are reached. In JavaScript, keep the total as a `Number` and do not use bitwise operations on it, because those truncate to 32 bits.

The Python version is short enough to read as pseudocode.

```python
items = [(color, weight) for color, weight in pairs]
items.sort(key=lambda item: (item[0], -item[1]))

total = 0
previous = None
for color, weight in items:
    if color != previous:
        total += weight
        previous = color
print(total)
```

The C version needs the comparator and the same scan.

```c
static int compare_items(const void *left, const void *right) {
    const Item *a = (const Item *)left;
    const Item *b = (const Item *)right;
    if (a->color != b->color) {
        return (a->color > b->color) - (a->color < b->color);
    }
    return (a->weight < b->weight) - (a->weight > b->weight);
}
```

The comparator returns a three-way result rather than a subtraction, so no difference can overflow. The weight comparison is reversed because heavier items come first within a color.

A reader who wants the direct form can replace the grouped scan with a hash set. The membership test is the only difference; the sort key becomes the weight alone, in descending order.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Sorting by weight ascending | The lightest item of each color is taken | Sort descending, or sort by color and weight descending |
| Taking the first item of each color in input order | A later, heavier item of the same color is lost | Sort before taking |
| Using a 32-bit total | The sum overflows above $2^{31} - 1$ | Use a 64-bit accumulator |
| Forgetting to mark an accepted color | Two items of the same color are added | Mark the color when it is accepted |
| Treating a budget as a matroid constraint | The exchange property fails and the greedy is wrong | Use 0/1 knapsack |
| Treating a matching as a partition matroid | Two chosen items can share a row or a vertex | Use matching or matroid intersection |
| Assuming every hereditary system is a matroid | Greedy is applied where no exchange argument exists | Check the exchange property |
| Sorting by color only | An arbitrary item of each color is taken | Sort by color and then by descending weight |
| Comparing string colors with `==` in Java | Reference equality, not value equality | Use `equals` or integer color IDs |
| Using bitwise operations on a JavaScript total | The value is truncated to 32 bits | Keep the total as a `Number` |
| Applying the theorem to negative weights without care | The greedy takes a negative item because its color is free | Skip negative items, or stop the scan at weight zero |

### Why this fails: an independence system that is not a matroid

The smallest counterexample has three items and five independent sets. Let

$$
E = \{a, b, c\}, \qquad \mathcal{I} = \{\emptyset, \{a\}, \{b\}, \{c\}, \{a, c\}\}.
$$

The family is hereditary: every subset of $\{a, c\}$ is listed, and every subset of $\{b\}$ is listed. The exchange property fails with $A = \{b\}$ and $B = \{a, c\}$. The larger set has two items, but neither $a$ nor $c$ can be added to $A$: the sets $\{a, b\}$ and $\{b, c\}$ are both dependent. So there is no element of $B \setminus A$ that can be exchanged into $A$.

Now give the items weights $w(a) = 6$, $w(b) = 10$, and $w(c) = 6$. The greedy scan in descending order takes $b$ first, for a total of 10, and then rejects both $a$ and $c$ because each forms a dependent set with $b$. The optimum is $\{a, c\}$ with total 12. The greedy loses by 2, and the reason is precisely the missing exchange property.

### Why this fails: a budget is not a matroid

Three items, one of each color, so the color rule imposes no restriction at all. Each item also has a cost, and the total cost must be at most 10.

| Item | Color | Weight | Cost |
| ---- | ----- | ------ | ---- |
| A    | red   | 6      | 6    |
| B    | blue  | 5      | 5    |
| C    | green | 5      | 5    |

The greedy by weight takes A, then tries B and C but cannot fit either, for a total of 6. The optimum is B and C, with total 10. The feasible sets are hereditary, but exchange fails: $S_1 = \{A\}$ and $S_2 = \{B, C\}$ are both feasible, and $|S_1| < |S_2|$, but adding either element of $S_2$ to $S_1$ exceeds the budget. A budget is an additive constraint outside the matroid family, and it needs a dynamic program rather than a matroid greedy.

## Variants and extensions

- **Capacities per color.** Replace $|I \cap E_j| \le 1$ with $|I \cap E_j| \le b_j$. The exchange proof still works: the class-count argument becomes a sum of capacities, and the same sorted scan accepts an item when its class still has room. The greedy is still optimal.
- **Laminar matroids.** The quotas form a laminar family instead of a partition: a group limit, a subgroup limit, and a global limit. The exchange property still holds, and the same weight-descending scan works. The feasibility test becomes a walk up the laminar tree.
- **Graphic matroids.** The independent sets are the forests of a graph. The greedy is Kruskal's algorithm: sort the edges by weight and add an edge when it joins two different components. The exchange property is the statement that a forest with fewer edges can always be extended by an edge from a larger forest.
- **Scheduling matroids.** The ground set is a set of unit-time jobs with deadlines, and a set is independent when all its jobs can be scheduled before their deadlines. The greedy sorts by profit descending and assigns each job to the latest free slot at or before its deadline, usually with a disjoint set union. This is the [scheduling with deadlines and release times](/algorithms/greedy/scheduling-deadlines-and-release-times) technique.
- **Linear matroids.** The independent sets are the linearly independent subsets of a vector space over a field. Over $GF(2)$, the greedy sorts the vectors by value descending and inserts each one into an XOR basis when it is independent. The [XOR bases](/algorithms/advanced/xor-bases) article develops the insertion.
- **Transversal matroids.** The independent sets are the subsets of one side of a bipartite graph that can be matched into the other side. Cardinality is found by augmenting paths, and the weighted version is the assignment problem. The [bipartite matching](/algorithms/graphs/bipartite-matching) article covers the unweighted case.
- **Matroid intersection.** The intersection of two matroids is not a matroid in general. Bipartite matching is the intersection of two partition matroids, and it needs augmenting paths rather than a single sort. Weighted matroid intersection is a harder algorithm still.
- **Matroid union.** The union of several matroids describes problems such as scheduling on several machines, where each machine contributes an independent set. The greedy does not extend; the standard tool is matroid union or a flow network.
- **Minimum-weight bases.** Negate the weights and use the same greedy, or sort ascending and take an item when independence is preserved. The proof is identical with the inequalities reversed.
- **Online arrivals.** When the items arrive one at a time and each must be accepted or rejected immediately, the offline sort is unavailable. The matroid secretary problem studies how well a threshold rule can do, and it is a different technique.

## Contest strategy

Under contest pressure, the matroid perspective is a checking tool as much as a solution. The rule can be applied with a fixed procedure.

1. Write down the ground set and the exact feasibility condition. If the condition is "at most one per class", the partition matroid is immediate.
2. Check heredity. If removing an item can make a set infeasible, the structure is not an independence system at all.
3. Check exchange on small sets. Try to find $A$ and $B$ with $|A| < |B|$ where no element of $B \setminus A$ can be added to $A$. If one exists, stop; the greedy is not justified.
4. If the structure is a matroid, sort by weight and use the feasibility test that the matroid provides. For a partition matroid the test is a color set; for a graphic matroid it is a disjoint set union; for a linear matroid it is a basis insertion.
5. Use a 64-bit accumulator and check the maximum possible total against the type. The sum, not the individual weight, is what overflows.
6. Test four inputs by hand: one item, all items in one color, all colors distinct, and a tie between the heaviest items of two colors.
7. If a budget, a matching, or a non-nested quota appears on top of the matroid, stop treating it as a single matroid. Use a dynamic program, a matching, or matroid intersection.

The order of steps 1 to 4 is deliberate. Contestants often recognize the greedy rule first and look for a proof afterwards; the matroid check is faster when the feasibility condition is written down before the rule is chosen.

## Worked problems

### Problem 1: milk scheduling

**Restatement.** $n$ cows each take one unit of time to milk. Cow $i$ gives $g_i$ gallons if milked before its deadline $d_i$. Time starts at $0$, so at most $x$ cows can be milked before time $x$. Maximize the total gallons. Constraints: $1 \le n \le 10\,000$, $1 \le g_i \le 1000$, $1 \le d_i \le 10\,000$.

**Naive baseline.** Try every subset of cows and check whether the subset can be scheduled. That is $O(n 2^n)$.

**Insight.** The schedulable subsets of unit jobs form a matroid, the scheduling matroid: a set is independent when its jobs can be matched to distinct slots before their deadlines, and the matchable subsets of one side of a bipartite graph form a transversal matroid. The greedy is therefore to sort the cows by gallons descending and place each cow in the latest free slot at or before its deadline.

**Derivation.** Sort the cows by $g_i$ descending. Maintain a disjoint set union over the slots $1, \ldots, \max d_i$, where slot $s$ is the unit of time ending at time $s$, and `find(t)` returns the latest free slot at or before $t$. A cow with deadline $d_i$ can use any slot up to $d_i$. For each cow, let $s = \text{find}(d_i)$. If $s \ge 1$, milk the cow in slot $s$, add $g_i$ to the answer, and union $s$ with $s - 1$ so the slot is no longer free. If $s < 1$, skip the cow.

**Correctness.** The schedulable subsets of unit-time jobs form a matroid: they are the sets that can be matched to distinct slots before their deadlines, which is a transversal matroid. The greedy theorem therefore applies directly, and the latest-free-slot assignment is exactly the independence test for the current prefix. The disjoint set union performs that test without rescanning the occupied slots.

**Complexity.** $O(n \log n)$ time for the sort, plus $O(n \alpha(n))$ for the disjoint set union, and $O(\max d_i)$ space for the slots.

**Common wrong approach.** Sorting by deadline and taking the first cow that fits. That maximizes the count of cows, not the gallons; a short deadline with a low yield can crowd out a high-yield cow.

### Problem 2: MST unification

**Restatement.** A connected undirected graph has $n$ vertices, $m$ edges, and positive weights. In one operation the weight of an edge can be increased by 1. Increase the weights using the fewest operations so that the minimum spanning tree cost stays the same but the MST becomes unique. Constraints: $n, m \le 200\,000$, weights up to $10^9$.

**Naive baseline.** Try every subset of edges to increase, which is exponential. A cheaper wrong idea is to increase every non-tree edge of one MST, which is not minimal.

**Insight.** The forests of a graph form the graphic matroid, and Kruskal's algorithm is the matroid greedy by weight. Two different MSTs can only differ inside a group of edges of equal weight. Inside one such group, an edge that joins two different components of the forest built from strictly lighter edges is a candidate: it can be part of some MST, and the group may contain more such candidates than the MST needs. Raising the surplus candidates by 1 removes the ambiguity at the smallest possible cost.

**Derivation.** Sort the edges by weight. Process the edges in groups of equal weight. Before touching the group, count how many of its edges join two different components of the forest built from strictly lighter edges; call that count $c$. Then union all edges of the group. If the group merges $k$ components in total, exactly $k$ of its edges are needed in every MST, and the other $c - k$ candidate edges create alternative MSTs. Add $c - k$ to the answer.

**Correctness.** The graphic matroid exchange property says that every maximal forest of the lighter edges can be extended to an MST, and that all choices inside an equal-weight group differ only by exchanges among edges of the same weight. Before the group is processed, $c$ of its edges join different components. After the group is processed, those edges merge $k$ components, so every MST uses exactly $k$ edges from this group and $c - k$ of the candidates are surplus. It is possible to keep a spanning forest of the candidate graph and raise the other $c - k$ edges by 1; then exactly one choice of $k$ candidates keeps the original weight, so the MST is unique and its cost is unchanged. Fewer than $c - k$ increments would leave more than $k$ candidates at the original weight, and some cycle among them would give a second MST, so the count is also necessary.

**Complexity.** $O(m \log m)$ time for the sort and $O(m \alpha(n))$ for the unions, with $O(n + m)$ space.

**Common wrong approach.** Counting every edge of an equal-weight group that is not chosen by one particular Kruskal run. That overcounts: some of those edges are chosen by another MST and do not need to be raised.

### Problem 3: spices

**Restatement.** There are $2^N - 1$ spices labeled $1, \ldots, 2^N - 1$, and spice $i$ costs $c_i$. Buy a set of spices so that every integer from $1$ to $2^N - 1$ can be written as the XOR of a nonempty subset of the bought labels. Minimize the total cost. Constraints: $2 \le N \le 16$, $1 \le c_i \le 10^9$.

**Naive baseline.** Enumerate every subset of the $2^N - 1$ spices, which is $2^{2^N - 1}$ subsets. That is already $32768$ for $N = 4$ and astronomical at $N = 16$.

**Insight.** The labels are vectors in $GF(2)^N$. A set of spices can produce every XOR exactly when its labels span the whole space. A spanning set contains a basis, and because all costs are positive, removing the redundant vectors lowers the cost. The problem is therefore to find a minimum-cost basis of a linear matroid.

**Derivation.** Sort the spices by cost ascending. Maintain an XOR basis over $N$ bits. For each spice, try to insert its label into the basis: if it reduces to a nonzero vector, it is linearly independent of the current basis, so buy it and add its cost; if it reduces to zero, it is dependent and is skipped. Stop when the basis has $N$ vectors, because no further spice can improve the answer.

**Correctness.** The linearly independent subsets of $GF(2)^N$ form a linear matroid. The matroid greedy sorts by cost ascending and adds each vector that preserves independence, which is exactly the insertion loop. The theorem for minimum-weight bases then gives the minimum-cost basis. Every spanning set contains a basis of cost no larger, so the minimum-cost spanning set is the minimum-cost basis.

**Complexity.** $O(2^N \cdot N)$ time for the insertions and $O(N)$ space for the basis.

**Common wrong approach.** Buying the $N$ cheapest spices. They can be linearly dependent, in which case they do not span the space and the selection is not a valid answer; the greedy may pay more but produces a valid, minimum-cost basis.

## Practice progression

1. **Recognition.** Given a statement, decide whether the feasible sets form a partition matroid. Write the color classes and the at-most-one condition explicitly, and check heredity first.
2. **Direct application.** Implement the weight-descending scan with a hash set, and verify it against brute force on random small inputs. Then implement the grouped form and confirm that it produces the same total, and the same items when each color's maximum is unique.
3. **Exchange practice.** Prove the exchange property for the partition matroid without looking at the article. Then prove it for capacities per color and for a laminar family of quotas.
4. **Failure analysis.** Build a small independence system that is not a matroid, and find weights on which the greedy fails. Do the same for a budget constraint.
5. **Transfer to graphs.** Implement Kruskal's algorithm as the matroid greedy on the graphic matroid, and identify the feasibility test as a disjoint set union.
6. **Transfer to scheduling and linear algebra.** Implement the deadline-and-profit greedy with a latest-free-slot structure, and the XOR basis greedy. Compare the three implementations: the sort key changes, the feasibility test changes, and the exchange proof has the same shape.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Define an independence system and state the two axioms. (Formal model)
2. State the exchange property in one sentence. (Formal model)
3. Prove that the partition matroid satisfies the exchange property. (Correctness proof)
4. Why does the direct per-color argument prove that the sorted greedy is optimal? (Correctness proof)
5. What does the invariant say after a prefix of the sorted scan? (Key insight)
6. Give a three-item independence system that is not a matroid, and weights on which the greedy fails. (Common mistakes)
7. Why does a budget break the matroid property? (Common mistakes)
8. What is the time bound, and which part is the sort? (Complexity analysis)
9. What changes when the problem asks for a minimum-weight basis? (Variants and extensions)
10. How does Kruskal's algorithm fit the perspective? (Variants and extensions)
11. How does the scheduling matroid assign jobs to slots? (Worked problems)
12. How does the linear matroid decide whether a vector is independent? (Worked problems)
13. Why do the reference programs sort by color instead of by weight? (Reference implementations)
14. What is the largest possible total, and which integer type holds it? (Implementation walkthrough)

## Further reading

- The greedy rule for intervals is another exchange argument with a different sort key, developed in [interval scheduling](/algorithms/greedy/interval-scheduling).
- The scheduling matroid is the subject of [scheduling with deadlines and release times](/algorithms/greedy/scheduling-deadlines-and-release-times).
- The graphic matroid and Kruskal's algorithm are developed in [minimum spanning tree](/algorithms/graphs/mst), and the feasibility test it uses is the [disjoint set union](/algorithms/graphs/dsu).
- The linear matroid over $GF(2)$ is the subject of [XOR bases](/algorithms/advanced/xor-bases).
- The problem that appears when a budget is added to the partition matroid is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The bipartite matching problem is the intersection of two matroids, and it is covered in [bipartite matching](/algorithms/graphs/bipartite-matching).
- The greedy that uses a feasibility test rather than a matroid is [greedy with a feasibility oracle](/algorithms/greedy/feasibility-oracle).
