---
id: trees.small-to-large-merging
title: Small-to-large merging
summary: Merge the smaller live component into the larger one at every vertex, so each vertex is charged only a logarithmic number of times and every subtree answer is built from its children.
division: [gold, platinum]
subjects: [trees]
level: intermediate
importance: common-contest-technique
keywords:
    [
        small to large,
        dsu on tree,
        set merging,
        distinct colors,
        subtree query,
        heavy child,
        merge smaller into larger,
    ]
prerequisites:
    required: [graphs.dfs, foundations.complexity]
    recommended: [trees.tree-dp, trees.lca, graphs.dsu]
complexity:
    time: "O(n log n) expected"
    space: "O(n)"
assumptions:
    - The input is a rooted tree, and every vertex carries one nonnegative color.
implementations: trees.small-to-large-merging
reviewed: false
---

<script setup lang="ts">
import AlgorithmSummary from "../../.vitepress/theme/components/articles/AlgorithmSummary.vue";
import CodeViewer from "../../.vitepress/theme/components/code/CodeViewer.vue";
import algorithm from "../../.vitepress/data/generated/algorithms/trees.small-to-large-merging.json";
</script>

<AlgorithmSummary :entry="algorithm" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer :entry="algorithm" />

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Answer a question about the set of values in the subtree of every vertex |
| **Time** | $O(n \log n)$ expected with hash sets |
| **Auxiliary space** | $O(n)$ |
| **Requires** | A rooted tree and an aggregate that is a set or a map |
| **Fails when** | The larger component is merged into the smaller one, or a child's set is copied instead of reused |
| **Primary technique** | Keep the set of the largest live component and insert the elements of every other component |
| **Related** | Tree dynamic programming, depth-first search, disjoint set union |

Every vertex owns a set: the distinct colors that occur in its subtree. The set of a parent is the union of the sets of its children, plus the parent's own color. Small-to-large merging computes all of those unions without ever copying the base child's set. At a vertex with children $u_1, \dots, u_k$, pick the child whose **live component** is largest, keep that child's set as the base, and insert every element of the other sets into it.

The live component of a set is the number of vertices that have already been merged into it. The reason the technique is fast is a single accounting fact. A merge scans only the set of the smaller component, and every color in that set can be charged to a vertex of that component. After the merge the two components are one, so the charged vertex belongs to a component that is at least twice as large. A component never holds more than $n$ vertices, so each vertex is charged at most $\lfloor \log_2 n \rfloor + 1$ times. The total number of scanned colors, and therefore insertions, is $O(n \log n)$, and a hash set makes each insertion expected constant time.

The answer for a vertex is the size of its set after the merge. No second traversal is needed, and no separate counter is needed, because a set already answers "how many distinct values" by its size.

## Problem motivation

A company keeps its reporting structure as a tree. Every employee belongs to one team, and the teams are identified by a number. The planning office asks, for every manager, how many different teams are represented among all employees in that manager's part of the organization.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ employees.
- Team identifiers reach $10^9$, so an array indexed by team is not possible without compression.
- The answer is wanted for **every** vertex, not for one query.

Collecting the teams of one subtree with a traversal costs $O(\text{size})$ per vertex. The sum of the subtree sizes is $O(n^2)$ in the worst case, and a chain realizes it: the root's subtree holds $n$ vertices, its child's holds $n - 1$, and so on, for a total of $n(n+1)/2$, which is about $2 \cdot 10^{10}$ at the maximum constraint.

A second naive approach builds a fresh set at every vertex and copies every child's set into it. That is correct, and it is also $O(n^2)$, because the chain copies $n, n-1, \dots, 1$ elements. The copies are the problem, not the sets.

The technique removes the copying. The base child's set is _moved_ to the parent rather than copied, and only the smaller components' sets are traversed. The same idea answers frequency questions, depth questions, and any other question whose state is a map from a key to a count.

## Recognition patterns

Small-to-large merging is the right tool when all of the following hold.

- The question asks for an aggregate over the **subtree of every vertex**.
- The aggregate of a vertex is the **union** of the aggregates of its children, plus the vertex's own value.
- The values **repeat**, so the answer is not simply the subtree size.
- The tree is **static**.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 2 \cdot 10^5$ | The $O(n \log n)$ bound is comfortable |
| Only one subtree is queried | A single depth-first traversal answers it in $O(n)$ |
| The question is about a **path** | Use heavy-light decomposition or a lowest common ancestor structure |
| The values are all distinct | The answer is the subtree size, and no set is needed |
| The values lie in a small range | A frequency array or a bitset may be simpler and faster |
| The tree changes between questions | The sets must be rebuilt; use a dynamic structure |
| A deterministic worst-case bound is required | A hash set is expected linear per operation; use a balanced search tree or segment tree merging |
| Only the global answer is wanted | One traversal with one set is enough |

The phrases in a statement that signal this technique are "for every vertex, count the distinct values in its subtree", "merge the maps of the children", and "the answer for a subtree is the union of the answers for its children". The phrase that rules it out is "the value on the path from $u$ to $v$", which points at a path structure rather than a subtree structure.

<Synonyms terms="small to large, small-to-large, DSU on tree, sack, set merging, merge smaller into larger, subtree sets" />

## Naive approach

The baseline returns a new set from every recursive call and unions the children's sets into it.

```python
def collect(v):
    result = {color[v]}
    for u in children[v]:
        result |= collect(u)
    return result
```

This is $O(n^2)$ on a chain, because the set of the deepest vertex is copied into its parent, then copied again into the grandparent, and so on. The total number of copied elements is $n + (n-1) + \cdots + 1$.

The second baseline is to run a separate traversal for every vertex, with a fresh visited array or a fresh set. It has the same quadratic bound and a larger constant.

The third baseline is to merge every child into the first child's set without comparing sizes.

```python
def merge_children(v):
    base = sets[children[v][0]]
    for u in children[v][1:]:
        for value in sets[u]:
            base.add(value)
    return base
```

This is also correct, and it is also $O(n^2)$: a comb whose largest child is listed last forces the large set to be traversed at every level. The weight comparison is not a detail, it is the whole complexity argument.

The naive traversal is still useful. It is the reference implementation for a differential test: generate random trees with small $n$, compare the answers, and a disagreement is a counterexample.

## Key insight

The insight is to make the **larger live component** the destination of every merge.

A live component is a subtree that has been finished but not yet merged into its parent, together with every set that has already been merged into it. Its **weight** is the number of vertices it represents.

Suppose the smaller component has weight $s$ and the larger has weight $t \ge s$. The algorithm scans the set of the smaller component. That set has at most $s$ distinct colors, because a component of weight $s$ contains $s$ vertices. Each scanned color comes from at least one vertex of the smaller component, and different colors come from different vertices, so the scan can be charged to the $s$ vertices one for one.

After the merge the two components are one, with weight $s + t \ge 2s$. Every charged vertex therefore belongs to a component that has at least doubled. A component never exceeds $n$ vertices, so each vertex is charged at most $\lfloor \log_2 n \rfloor + 1$ times. The total number of scanned colors, and therefore insertion attempts, is $O(n \log n)$.

The largest component's set is never traversed. It becomes the parent's set by a pointer or container swap, which costs constant time. Only the other components' sets are read.

Why not compare the number of distinct colors directly? Two sets from different subtrees can share colors, so their union can be much smaller than the sum of their sizes. The component weight is the quantity that adds exactly, because components are disjoint as sets of vertices. That is what makes the doubling argument exact. Comparing distinct sizes is a common variant and is usually fast, but the proof in this article uses the weight, and the reference programs maintain it.

There is a second, quieter insight: the set itself is the answer. After all children have been inserted, its size is exactly the number of distinct colors in the subtree. The algorithm does not need a separate counting array, and it does not need a post-processing pass over the tree.

## Visual intuition

Draw each vertex as a box that holds the colors of its subtree, and write the number of vertices in the box on its lid. A leaf starts with a box of weight one. At an internal vertex, the box of the child with the largest weight is lifted up and kept; the smaller boxes are emptied into it, one color at a time. The emptied boxes disappear, and the surviving box's weight becomes the sum of the weights of the boxes that were combined.

The boxes that still exist at any moment sit on a frontier of the tree: they belong to subtrees that have been finished but not yet merged into their parents. Those subtrees are disjoint, so the weights of all live boxes add up to at most $n$, and the total number of colors stored in them is at most $n$. That is where the linear space bound comes from.

Follow one vertex through the process. It starts in a component of weight one. Every time its component is the smaller of the two being merged, the combined component has weight at least twice the old weight:

| Merge | Weight of the smaller component | Weight of the combined component |
| ----- | ------------------------------- | -------------------------------- |
| 1     | 1                               | at least 2                       |
| 2     | 2                               | at least 4                       |
| 3     | 4                               | at least 8                       |
| $k$   | $2^{k-1}$                       | at least $2^k$                   |

After $\lfloor \log_2 n \rfloor + 1$ such merges the component would need more than $n$ vertices, which is impossible. The vertex therefore stops being on the smaller side.

The box's number of colors can grow more slowly than its weight. That is exactly why the weight, not the color count, is the quantity that drives the comparison.

## Formal model

Let $T$ be a rooted tree with vertex set $V$, root $r$, and a color $c(v)$ for every vertex $v$.

::: math definition Definition
The **subtree** of a vertex $v$, written $\operatorname{subtree}(v)$, is the set of vertices whose path to the root passes through $v$, including $v$ itself. The **children** of $v$ are the vertices whose parent is $v$.
:::

::: math definition Definition
The **color set** of a vertex $v$ is

$$
S(v) = \{ c(u) : u \in \operatorname{subtree}(v) \}.
$$

The **answer** for $v$ is $\lvert S(v) \rvert$, the number of distinct colors in its subtree.
:::

::: math definition Definition
The **live component** of a vertex $v$ during the sweep is the set of vertices already merged into the set stored at $v$, including $v$ itself. Its **weight** $W(v)$ is the number of vertices in that component.
:::

::: math definition Definition
A **base child** of a vertex $v$ is a child $b$ whose live component has maximum weight among the children of $v$. Ties are broken arbitrarily. The **small-to-large merge rule** keeps $S(b)$ as the destination, inserts $c(v)$ into it, and then inserts every element of $S(u)$ for every other child $u$.
:::

::: math lemma Lemma
If every element of a set $B$ is inserted into a set $A$, the result contains exactly the elements of $A \cup B$, and its size is $\lvert A \cup B \rvert$.
:::

::: math proof Proof
Every element of $A$ was already present, and every element of $B$ is inserted. An insertion that finds an element already present changes nothing. Thus the final set is exactly $A \cup B$, and a set stores each distinct value once, so its size is the number of distinct values.
:::

::: math lemma Lemma
Suppose a live component of weight $s$ is merged into a live component of weight $t$ with $s \le t$. After the merge the combined component has weight $s + t \ge 2s$, and the set scanned by the merge has at most $s$ elements.
:::

::: math proof Proof
The two components are disjoint sets of vertices before the merge, so their weights add. The scanned set stores distinct colors, one entry per color, and each color occurs at least once among the $s$ vertices of the smaller component. A set of distinct colors therefore has at most $s$ entries.
:::

::: math lemma Lemma
The total number of set elements scanned by the merge rule over the whole tree is at most $n(\lfloor \log_2 n \rfloor + 1)$.
:::

::: math proof Proof
Charge every scanned color to a distinct vertex of the smaller component that carries it. Different colors have different vertices, because one vertex carries one color, so the $s$ charges fit inside the $s$ vertices. By the component lemma, every charged vertex belongs to a component that has at least doubled after the merge. A component holds at most $n$ vertices, so each vertex is charged at most $\lfloor \log_2 n \rfloor + 1$ times. Summing over the $n$ vertices gives the bound. An insertion of a duplicate color is scanned and charged in the same way; it changes no set, but it is still paid for.
:::

::: math lemma Lemma
When the algorithm processes a vertex $v$, the set stored at $v$ is exactly $S(v)$.
:::

::: math proof Proof
The proof is by induction on the processing order, which visits children before parents. A leaf starts with the singleton set that holds its own color, which is its color set. For a non-leaf $v$, every child $u$ has already been processed, and its set is $S(u)$ by the induction hypothesis. Each child's set has been merged into $v$ by the merge rule, and the vertex's own color was present from the start. The merge lemma says that the result is the union of the children's color sets and the vertex's color, which is exactly $S(v)$.
:::

## Algorithm derivation

The state is one set per vertex, the parent array, the answer array, and the weight array. The input contract numbers every parent before its child, so the vertices are already in a topological order and the reverse index order is a valid postorder.

1. For every vertex $v$, create a set that contains only $c(v)$ and set `weight[v] = 1`.
2. For $v$ from $n-1$ down to $1$:
    1. Record `answer[v] = size(set[v])`. Every child of $v$ has a larger index, so all of them have already been merged into `set[v]`.
    2. Let $p$ be the parent of $v$.
    3. If `weight[p] < weight[v]`, exchange `set[p]` with `set[v]` and exchange the two weights.
    4. Insert every color of `set[v]` into `set[p]`.
    5. Add `weight[v]` to `weight[p]`.
    6. Release `set[v]`, which is now empty of ownership and will never be used again.
3. Record `answer[0] = size(set[0])`.
4. Print the answers in index order.

The weight comparison in step 2.3 is what selects the base child. Before the comparison, `set[p]` holds the parent's own color and the sets of the children that were already processed, so `weight[p]` counts the vertices represented by that partial component. The child $v$ is the current child, and `weight[v]` is the size of its complete subtree. Keeping the component with the larger weight is exactly the small-to-large rule, applied once per edge.

::: math invariant Invariant
Before iteration $v$ begins, the live components partition the vertex set. The weight of each component is its number of vertices, and the set stored at its root is the set of their colors. In particular, the set stored at $v$ is $S(v)$.
:::

The invariant is preserved because iteration $v$ merges the component of $v$ into the component of its parent, adds the two weights, and removes the component of $v$ from the live collection. The parent's set becomes the union of the two color sets, which is exactly the color set of the combined component. The partition is still a partition, and the sum of the weights is still $n$.

When the input does not number parents before children, the same derivation works after one iterative traversal produces a postorder. The only change is the order of the loop, not the merge rule.

## Step-by-step execution

Take the tree with edges $0-1$, $0-2$, $1-3$, $1-4$, $2-5$, $5-6$, rooted at $0$, and colors

$$
c(0)=1,\quad c(1)=2,\quad c(2)=1,\quad c(3)=3,\quad c(4)=2,\quad c(5)=1,\quad c(6)=3.
$$

The parents are $p(1)=0$, $p(2)=0$, $p(3)=1$, $p(4)=1$, $p(5)=2$, $p(6)=5$, so the input lists the parents in the order $0, 0, 1, 1, 2, 5$.

The initial sets are the singletons:

| Vertex | 0       | 1       | 2       | 3       | 4       | 5       | 6       |
| ------ | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Set    | $\{1\}$ | $\{2\}$ | $\{1\}$ | $\{3\}$ | $\{2\}$ | $\{1\}$ | $\{3\}$ |

The reverse sweep starts at vertex $6$.

| Step | $v$ | Parent | Component weights before | Set sizes before | Action | Parent's set after | `answer[v]` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 6 | 5 | $1, 1$ | $1, 1$ | Insert $3$ | $\{1,3\}$ | 1 |
| 2 | 5 | 2 | $1, 2$ | $1, 2$ | Child larger, swap; insert $1$ (present) | $\{1,3\}$ | 2 |
| 3 | 4 | 1 | $1, 1$ | $1, 1$ | Insert $2$ (present) | $\{2\}$ | 1 |
| 4 | 3 | 1 | $2, 1$ | $1, 1$ | No swap; insert $3$ | $\{2,3\}$ | 1 |
| 5 | 2 | 0 | $1, 3$ | $1, 2$ | Child larger, swap; insert $1$ (present) | $\{1,3\}$ | 2 |
| 6 | 1 | 0 | $4, 3$ | $2, 2$ | No swap; insert $2$ and $3$ | $\{1,2,3\}$ | 2 |
| 7 | 0 | none | $7$ | $3$ | Record the root's size | $\{1,2,3\}$ | 3 |

At step 2 the child's component is larger, so the containers and the weights are exchanged before the insertion. The parent ends up with the larger component, and the child's old container is the one that is emptied.

Step 4 is where the weight and the set size disagree. The parent's component already holds vertices $1$ and $4$, so its weight is $2$, while both sets hold one color. The weight comparison keeps the parent's container as the base; a comparison of distinct set sizes would see a tie. Both choices give the right union here, but the weight is the quantity that the proof charges.

At step 6 the parent's component is larger ($4$ against $3$) even though both sets hold two colors. No swap is needed. The color $3$ is already present in the parent's set, while $2$ is new; the size grows by one, from $2$ to $3$, not by two.

The answers in index order are $3, 2, 2, 1, 1, 2, 1$. Every one of them is the size of the corresponding final set, including the leaves, whose sets were never modified after initialization.

## Correctness proof

::: math theorem Theorem
After the algorithm finishes, `answer[v]` equals the number of distinct colors in the subtree of $v$, for every vertex $v$.
:::

::: math proof Proof
The proof has two parts: the set stored at $v$ when it is processed is exactly $S(v)$, and its size is therefore the answer.

The first part is the subtree lemma from the formal model, proved by induction on the processing order. The key point is that the order is a postorder: every child of $v$ has a larger index than $v$, because every parent is numbered before its child. A child is therefore processed before its parent. When the child is processed, the algorithm merges the child's complete set into the parent. When $v$ is processed, every child has already contributed, and no vertex outside the subtree of $v$ can contribute to $v$, because the only merge out of a vertex goes to its parent.

The second part is the merge lemma: inserting every element of the smaller component's set into the larger component's set produces the union, and a set contains each distinct value once. Thus the size of the set at $v$ is exactly the number of distinct colors in $S(v)$.

The root is processed last. Its set has received every other vertex through the chain of merges, so its size is the number of distinct colors in the whole tree. If the tree is a forest, each component is handled the same way from its own root; the answer for a vertex in another component is the size of that component's set.
:::

The correctness argument does not depend on which child is chosen as the base. Any child works; the weight comparison is there only to make the merge cheap. This separation is useful when a problem has a tie in the largest component: either choice produces the same union, so the tie can be broken arbitrarily.

## Complexity analysis

**Initialization: $O(n)$.** One singleton set per vertex, one insertion per vertex, and one unit of weight per vertex.

**The sweep: $O(n \log n)$ expected scans.** Each edge causes one merge. The merge scans only the set of the smaller live component, and that set has at most as many elements as the component has vertices. The charge lemma bounds the total number of scanned elements by $n(\lfloor \log_2 n \rfloor + 1)$. A hash set performs an insertion in $O(1)$ expected time. The container swap and the weight addition are constant time.

**The answers: $O(n)$.** Reading the size of a set is constant time, and one line is printed per vertex.

**Space: $O(n)$.** The live components partition the vertices, so their weights add up to $n$. The set of a component has at most one entry per vertex of that component, so the total number of stored colors over all live sets is at most $n$. The parent, answer, and weight arrays are $O(n)$. Each hash table has a constant minimum capacity, which is $O(n)$ tables and therefore $O(n)$ buckets. The memory of a released child set is reclaimed by the language's ownership rule: `free` in C, the destructor in Pascal, and the garbage collector in Java and JavaScript.

::: math complexity Complexity
Small-to-large merging over a tree of $n$ vertices: $O(n \log n)$ expected time, $O(n \log n)$ scanned set elements in the worst case, and $O(n)$ auxiliary space.
:::

The expected qualifier comes from the hash set. A balanced search tree gives a deterministic $O(n \log^2 n)$ bound, because each of the $O(n \log n)$ scans costs $O(\log n)$ for the insertion. Segment tree merging can give $O(n \log n)$ deterministically for some aggregates, but it is a different implementation with a larger constant.

A variant that compares the number of distinct colors instead of the component weight is also common. It is usually fast, but the union of two overlapping color sets can grow much more slowly than the sum, so the clean doubling argument does not apply to it. The reference programs maintain the weight explicitly, and the proof above is about that implementation.

The bound is tight enough for the usual constraints. At $n = 200\,000$, $n \log_2 n$ is about $3.6 \cdot 10^6$ scans. A hash set performs that many insertions comfortably in the time limit of a typical contest problem, and the live storage stays linear.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Distinct values in every subtree | Small-to-large merging |
| One subtree query | A single depth-first traversal |
| Values on a path between two vertices | Heavy-light decomposition or a lowest common ancestor structure |
| Frequency aggregate with no persistence between subtrees | DSU on tree, also called sack, with one global frequency array |
| Queries known in advance on paths | Mo's algorithm on the Euler tour |
| Values in a small range | A frequency array indexed by value |
| A deterministic worst-case bound | Segment tree merging or a balanced search tree per subtree |
| The tree changes between queries | Rebuild, or use a dynamic tree structure |
| The answer is just the subtree size | No set at all; one postorder size pass |

The closest alternative is DSU on tree. Both techniques are $O(n \log n)$, and both are often called "DSU on tree" in contest discussion. The difference is the state. Sack keeps one global frequency array, adds a subtree, records the answer, and then removes the light subtrees; that is faster in practice and uses less memory, but it requires the aggregate to support removal. Small-to-large merging keeps a separate set or map per live subtree, so it works for aggregates that only support insertion, such as a set of distinct colors or a trie.

The second alternative is segment tree merging. It merges two dynamic segment trees over the same key range, which is deterministic and supports order statistics, but it needs a node per inserted key and a merge routine. When the key range is small and fixed, it is often the stronger choice.

## Reference implementations

The six reference programs all implement the same contract.

```
Input:
  n
  c0 c1 ... c(n-1)
  parent[1] parent[2] ... parent[n-1]

Every parent lies in 0..v-1, so vertex 0 is the root and the vertices are
listed in a topological order.

Output:
  n lines; line v holds the number of distinct colors in the subtree of v.
```

The reverse index order is a postorder for this contract. A vertex's children always have larger indices, so by the time the sweep reaches a vertex, all of its children have been merged into it.

| Language | Set representation | Storage note |
| --- | --- | --- |
| C | Open-addressing hash set | `-1` is the empty marker; the set owns its slots |
| C++17 | `std::unordered_set<int>` | One container per vertex, swapped when the child's component is larger |
| Java | `HashSet<Integer>` | The garbage collector reclaims a cleared child set |
| Python | Built-in `set` | `update` iterates the smaller set |
| Pascal | `TIntSet` class | Open addressing, explicit destructor |
| JavaScript | Built-in `Set` | The set is cleared after the merge |

All six variants are `program` variants: they read standard input and write standard output, and they are listed as unverified until a reviewer runs them. All six keep a separate weight for every live component and swap the weights together with the containers, so the merge decision is the one the proof describes. The C and Pascal variants use `-1` as the empty marker, so the contract requires nonnegative colors. The other four accept any 32-bit integer that their language can read, but the shared fixtures use nonnegative colors so the six programs remain interchangeable.

The C variant writes to standard output in binary mode on Windows, and the Python variant writes bytes, so the line feed is the same byte in every language. Java, C++, JavaScript, and Pascal use their ordinary line output; the test harness normalizes the platform line ending before comparing.

## Recursion decision

The natural description of the algorithm is a depth-first traversal that returns a set from every child. The reference implementations do not use that recursion.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The failure mode is a crash, not a wrong answer: a segmentation fault in C, a `StackOverflowError` in Java, a `RecursionError` in Python.

When the input numbers parents before children, the reverse index sweep is already iterative and needs no traversal. When it does not, build the children lists and one order with an explicit stack:

```python
order = []
stack = [0]
while stack:
    v = stack.pop()
    order.append(v)
    stack.extend(children[v])

for v in reversed(order):
    # All descendants of v have been processed, so set[v] is complete.
    answer[v] = len(sets[v])
    # Merge set[v] into set[parent[v]].
```

Reversing a preorder puts every descendant before its ancestor, which is all the merge needs. The order does not have to be a strict postorder; it only has to put children before parents.

## Implementation walkthrough

The first decision is the input order. The contract gives the parent of every vertex and guarantees that the parent's index is smaller. That turns the tree into a topological order for free, and the implementation can avoid both adjacency lists and recursion. The reference programs rely on this guarantee. A version that accepts an arbitrary numbering must build children lists and an explicit order, as the previous section shows.

The second decision is the direction of the merge. The child's set is complete when the child is processed; the parent's set is still growing. The algorithm therefore merges the child into the parent, not the other way around. The weight test decides which component is kept:

```cpp
for (int v = n - 1; v >= 1; --v) {
    answer[v] = static_cast<int>(sets[v].size());
    const int p = parent[v];
    if (weight[p] < weight[v]) {
        sets[p].swap(sets[v]);
        std::swap(weight[p], weight[v]);
    }
    for (int c : sets[v]) {
        sets[p].insert(c);
    }
    weight[p] += weight[v];
    sets[v].clear();
}
```

After the optional swap, `sets[p]` belongs to the larger component and `sets[v]` belongs to the smaller one. The loop iterates the smaller set. The `clear` at the end releases the elements of the smaller container while keeping the container itself available for reuse; in C and Pascal the container is released outright.

The weight is the number of vertices represented by the component, not the number of distinct colors. It is the quantity that adds exactly when two disjoint components are combined, and it is what makes the doubling argument valid even when the two sets share colors. The two arrays are swapped together so that the weight always describes the set stored beside it.

The third decision is the set representation. A hash set gives expected constant-time insertion and membership. The C and Pascal variants implement open addressing because neither language has a hash set in its standard library. They use `-1` as the empty marker, which is why the contract restricts colors to nonnegative values. The load factor is kept below about 0.7 by doubling the table when it is reached.

The fourth decision is the answer. It is the size of the set after the merge, not a separate counter. This avoids a class of bugs in which a color is inserted but the counter is not incremented, or a duplicate is counted twice. The only place where a separate counter would be needed is an aggregate that is not a set, such as the sum of the dominant colors in the Lomsat problem.

The fifth decision is ownership. In C, `free` releases the child's slots. In Pascal, the child's destructor runs when the instance is freed. In Java and JavaScript, clearing the child's set drops the references and the collector does the rest. Releasing the child is what keeps the live storage linear; keeping a pointer to a released set is a use-after-free bug, and the next section lists it.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Merging the larger component into the smaller one | The doubling argument fails and the running time becomes quadratic | Compare the weights and keep the larger component |
| Copying the base child's set | The large set is traversed at every level | Swap the container instead of copying it |
| Forgetting to update the component weight | The next comparison uses a stale size and can choose the wrong base | Add the smaller weight to the larger one after every merge |
| Comparing distinct set sizes and claiming the doubling proof | Overlapping colors can make the union grow by less than a factor of two | Compare the number of vertices represented by each live component |
| Forgetting the vertex's own color | The answer is short by one whenever the color is new | Insert `color[v]` before or during the merge |
| Counting every inserted element as new | Duplicate colors inflate the answer | Count only insertions that were absent, or read the final set size |
| Adding the children's answers | A color shared by two children is counted twice | Merge the sets and take the size of the union |
| Summarizing the tree with a single set | The set of one subtree is destroyed while another subtree still needs it | Keep one set per live subtree |
| Recursing on a chain | The call stack overflows at depth $n$ | Use a reverse topological order or an explicit stack |
| Indexing an array by color | Colors reach $10^9$ and the array is impossible | Use a hash set or coordinate compression |
| Recomputing a set's size after every insertion | The size is already stored by the container | Read the container's size once when the set is complete |
| Mutating a set while iterating it | The iteration order is undefined or the loop skips elements | Iterate the smaller set and insert into a different set |
| Keeping a pointer to a released child set | Use-after-free or a stale alias | Release the child only after the merge, and never read it again |
| Assuming the input is ordered | The postorder is wrong when a parent has a larger index than its child | Build an explicit order unless the contract guarantees the numbering |

### Why this fails: adding the children's answers

The smallest counterexample is three vertices. Let vertex $0$ be the root with children $1$ and $2$, and give all three vertices the same color $7$.

The subtree of vertex $1$ has one distinct color, and so does the subtree of vertex $2$. Adding the children's answers and adding one for the root gives $1 + 1 + 1 = 3$. The correct answer is $1$, because all three vertices share the same color.

The failure is not a small numerical error. It grows with every shared color, and a tree with two large children whose subtrees use the same palette can double the true answer. The merge is what removes the duplicates; the size of the union is not the sum of the sizes.

### Why this fails: always keeping the first child's set

The smallest chain already shows the extra work. Take vertices $0-1-2$ with three distinct colors and always keep the parent's set as the destination.

- Vertex $2$ is merged into vertex $1$: one insertion, and the set of vertex $1$ has two colors.
- Vertex $1$ is merged into vertex $0$: two insertions, and the set of vertex $0$ has three colors.

The total is three insertions. Small-to-large merges the two singleton sets at the bottom, then keeps the resulting component of weight two and scans the root's singleton, for a total of two insertions.

On a chain of four distinct colors the unconditional version performs $1 + 2 + 3 = 6$ insertions, while small-to-large performs $3$. On a chain of $n$ vertices the first is $n(n-1)/2$ and the second is $n-1$, so the gap is quadratic. The output is still correct in both cases; only the running time fails.

A third version, which builds a fresh empty set at every vertex and inserts all children into it, is also correct and also quadratic. It fails on the same chain because the large set is copied at every level. The weight comparison is what separates the linear-logarithmic version from these correct-but-slow versions.

## Variants and extensions

- **DSU on tree, or sack.** Keep one global frequency array, add the heavy child's subtree, record the answer, add the light subtrees, and remove them afterward. The total work is $O(n \log n)$, the memory is $O(n)$, and the constant is usually smaller than a set per vertex. It requires the aggregate to support removal.
- **Frequency maps.** Store color to count in a map and merge smaller into larger. The maximum frequency and the sum of the colors at that frequency are maintained during the merge; this is the Lomsat pattern.
- **Depth maps.** Store depth to count and merge by absolute depth so that no key has to be shifted. This answers the dominant-index question on a tree with up to $10^6$ vertices.
- **Tries.** Merge two tries by inserting the smaller trie's strings into the larger one. The same doubling argument bounds the total number of inserted characters, and the aggregate is the number of distinct prefixes or strings.
- **Segment tree merging.** Merge two dynamic segment trees over the same key range. The merge is deterministic, supports order statistics, and often replaces a hash map when the key range is bounded.
- **Mergeable heaps.** A leftist heap or a skew heap supports merging two heaps in logarithmic time, which is the heap analogue of the same accounting.
- **Disjoint set union by size.** The union-find operation merges the smaller component into the larger one for the same reason: each element's component size at least doubles. Small-to-large merging is the tree-set version of that idea.
- **Offline vertex queries.** Attach each query to its vertex, build the complete set at the vertex, and answer all queries attached there before merging upward. This avoids storing the set after it is no longer needed.
- **Long-path decomposition.** For depth-indexed aggregates, following the longest child and reusing its array gives an $O(n)$ bound, which is stronger than small-to-large but applies only to depth-shaped state.

## Contest strategy

Under contest pressure, the following procedure avoids the usual mistakes.

1. Root the tree and obtain a postorder. If the input numbers parents before children, the reverse index order is already a postorder.
2. Decide what the payload is: a set of values, a frequency map, a depth map, or a trie. The merge rule is the same; only the insertion and the summary change.
3. At every vertex, find the child with the largest live component, measured by the number of vertices it represents. Keep that child's payload and discard the other containers after inserting their elements.
4. Insert the vertex's own value before recording the answer, and add the smaller component's weight to the larger one.
5. Record the answer from the payload's summary: its size for a distinct-count problem, its maximum and sum for a dominant-color problem, its best depth for a depth problem.
6. Release or clear every child container immediately after the merge. The linear space bound depends on it.
7. Test the four smallest shapes explicitly: a single vertex, a chain, a star, and two children with identical colors. Then test a balanced tree with repeated colors.
8. Write the brute-force subtree traversal and compare on a few hundred random trees. A disagreement is a counterexample worth more than an hour of reading.
9. Check the accumulator width. A sum of colors can exceed 32 bits even when every individual color fits.
10. If the time limit is tight, replace the per-vertex hash sets with the sack variant, or replace the hash set with a sorted vector when the total number of distinct keys is small.

## Worked problems

### Problem 1: distinct colors in every subtree

**Restatement.** A rooted tree of $n$ vertices is given. Each vertex has a color, and the colors can be as large as $10^9$. For every vertex, print the number of distinct colors in its subtree. Constraints: $1 \le n \le 200\,000$.

**Naive baseline.** Run a traversal from every vertex and collect its colors in a set. The total work is the sum of the subtree sizes, which is $O(n^2)$ on a chain.

**Insight.** The color set of a vertex is the union of its children's color sets plus its own color. Reusing the set of the child with the largest live component avoids copying that set at every level.

**Derivation.** Root the tree, obtain a postorder, and give every vertex a singleton set. At each vertex, keep the set of the child with the largest live component, insert the vertex's color, insert every other child's set, and record the size. The implementation in this article does the same thing by merging each vertex into its parent in reverse index order, maintaining the component weight alongside the set.

**Correctness.** By induction over the postorder, the set at a vertex is the union of the color sets of its children and its own color, which is exactly the color set of its subtree. A set stores each color once, so its size is the number of distinct colors.

**Complexity.** $O(n \log n)$ expected time and $O(n)$ space.

**Common wrong approach.** Summing the children's answers. Two children that share a color contribute it twice, and the error is visible on the three-vertex tree in the previous section.

### Problem 2: Lomsat gelral

**Restatement.** A rooted tree of $n$ vertices is given, and every vertex has a color. A color dominates a subtree if no other color occurs there more often. For every vertex, print the sum of all colors that dominate its subtree. Constraints: $1 \le n \le 100\,000$.

**Naive baseline.** Build a frequency map for every subtree from scratch. The total work is $O(n^2)$ on a chain.

**Insight.** The frequency map of a vertex is the union of its children's maps plus its own color. The map of the child with the largest live component can be kept, and the smaller maps inserted into it. The answer is maintained together with the map: the maximum frequency and the sum of the colors that attain it.

**Derivation.** At each vertex, keep the map and the `best` and `sum` values of the child with the largest live component. Insert the vertex's own color and every entry of the other children's maps. When the count of a color becomes greater than `best`, set `best` to the new count and `sum` to that color. When it becomes equal to `best`, add the color to `sum`. The final `sum` is the answer for the vertex.

**Correctness.** The map stores the exact frequency of every color in the subtree, by the same induction as the distinct-color problem. The pair `(best, sum)` is maintained as an invariant: `best` is the maximum frequency and `sum` is the sum of the colors whose frequency equals `best`. Every insertion updates the pair by the two rules above, so it stays correct.

**Complexity.** $O(n \log n)$ expected time with a hash map, or $O(n \log^2 n)$ with an ordered map, and $O(n)$ space.

**Common wrong approach.** Using a 32-bit accumulator. The sum of the dominating colors can reach about $n(n+1)/2$, which is $5 \cdot 10^9$ at $n = 10^5$, so the accumulator must be 64-bit. A second common mistake is replacing `sum` instead of adding to it when a color ties the current maximum.

### Problem 3: Dominant Indices

**Restatement.** A rooted tree of $n$ vertices is given. For a vertex $x$, let $d_{x,i}$ be the number of vertices in the subtree of $x$ at distance $i$ from $x$. The dominant index of $x$ is the smallest $i$ for which $d_{x,i}$ is maximum. Print the dominant index of every vertex. Constraints: $1 \le n \le 10^6$.

**Naive baseline.** Compute the depth array of every vertex with a separate traversal. The total work is $O(n^2)$ on a chain, and $n = 10^6$ makes even the memory of all arrays impossible.

**Insight.** A map from depth to count is the depth array in sparse form. The map of a vertex is the merge of its children's maps, so the map of the child with the largest live component can be kept and the others inserted into it.

**Derivation.** Store absolute depths, measured from the root, rather than distances from the current vertex. Then a child's keys are already valid in the parent's map and no key has to be shifted. At each vertex, keep the map of the child with the largest live component, insert the vertex's own absolute depth, and insert the other children's entries. Maintain the absolute depth with the largest count, breaking ties toward the smaller depth. The answer for the vertex is that depth minus the vertex's own depth, because the problem measures distance from the vertex.

**Correctness.** The map contains the exact count of descendants at every absolute depth in the subtree. The best pair is maintained by comparing counts and, on a tie, the smaller depth. Subtracting the vertex's depth translates absolute depth back to distance, which is exactly the index $i$.

**Complexity.** $O(n \log n)$ expected time and $O(n)$ space. The official solution uses long-path decomposition for an $O(n)$ bound, but the small-to-large version fits the constraints with a larger constant.

**Common wrong approach.** Shifting every key by one when a child's map moves to its parent. That turns the merge into a linear operation per edge and recovers the quadratic bound. A second mistake is breaking ties toward the larger depth, which violates the definition of the dominant index.

## Practice progression

1. **Recognition.** Given a statement, decide whether the state is a set or a map over every subtree. Look for "for every vertex", "distinct", and "in the subtree".
2. **Direct application.** Implement distinct colors in every subtree with a set per vertex, then compare against a brute-force traversal on random small trees.
3. **Adaptation.** Replace the set with a frequency map and maintain a maximum and a sum, as in Lomsat gelral. Then replace it with a depth map and maintain a best depth, as in Dominant Indices.
4. **Combination.** Combine the merge with an Euler tour and offline queries, or with a segment tree that supports order statistics. Compare the result with the sack variant on the same test.
5. **Challenge.** Solve a problem with $n = 10^6$ under a memory limit, where one hash set per vertex is too expensive. Switch to the sack variant or to long-path decomposition and measure the difference.
6. **Transfer.** Use the same accounting for merging tries, mergeable heaps, or disjoint-set components. The rule is always "move the smaller structure into the larger one".

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why does the merge compare component weights rather than distinct set sizes? (Key insight)
2. How many times can one vertex be charged, and what proves it? (Formal model)
3. What do the set and the weight store before a vertex's children are merged, and what do they store after? (Algorithm derivation)
4. Why is the reverse index order a postorder for the reference input? (Algorithm derivation)
5. Why is the answer the size of the set rather than a separate counter? (Implementation walkthrough)
6. What is the smallest tree on which summing the children's answers is wrong? (Why this fails)
7. What is the cost of always keeping the first child's set on a chain of $n$ vertices? (Why this fails)
8. When is DSU on tree preferable to one set per vertex? (Algorithm selection)
9. Why must the depth map store absolute depths instead of distances from the current vertex? (Worked problems)
10. What is the total space bound, and why do the live sets fit inside it? (Complexity analysis)

## Further reading

- The dynamic programming that computes a subtree answer from the answers of its children is [tree dynamic programming](/algorithms/trees/tree-dp).
- The structure that answers ancestor and path questions on a static tree is [lowest common ancestor](/algorithms/trees/lca).
- The decomposition that answers path aggregates by splitting a path into logarithmically many ranges is [heavy-light decomposition](/algorithms/trees/heavy-light-decomposition).
- The disjoint set structure whose union-by-size rule uses the same accounting is [disjoint set union](/algorithms/graphs/dsu).
- The traversal that produces the postorder used by the merge is [depth-first search](/algorithms/graphs/dfs).
