---
id: graphs.dsu
title: Disjoint set union
summary: A structure that keeps a partition of the elements into sets and answers whether two elements share a set, in amortized constant time.
division: [silver, gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [disjoint set union, dsu, union find, connectivity, path compression, union by size]
prerequisites:
    required: [foundations.recursion]
    recommended: [graphs.representation, start.data-structures]
complexity:
    time: "O((n + q) alpha(n))"
    space: "O(n)"
assumptions:
    - Operations are only unions and membership queries; there is no deletion.
implementations: graphs.dsu
visualization: graphs.dsu
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="graphs.dsu" />

A disjoint set union, also called a union-find, maintains a partition of $n$ elements into sets. It supports two operations: merging the sets of two elements, and asking whether two elements are in the same set. Both take amortized constant time.

The structure is a forest of rooted trees stored in a flat array. Each element has a parent pointer; the root of a tree is the representative of its set, and two elements are in the same set exactly when their representatives are equal. Two optimizations make it fast: path compression points every element on a path directly at the root, and union by size attaches the smaller tree below the larger one.

The whole point of the structure is that it never splits a set. That is also its one hard limitation, and it is worth checking the statement for the word "remove" before reaching for it.

## Problem motivation

A school has $n$ students, and friendships are announced one at a time. After each announcement, the principal wants to know how many friendship groups exist, and whether two particular students are in the same group.

The constraints:

- $1 \le n \le 10^6$ students.
- $q \le 10^6$ announcements and questions.
- A question asks whether two students are connected by a chain of friendships, directly or indirectly.

The naive solution keeps a label for each group and, when two groups merge, relabels every member of the smaller group. Each student is relabeled $O(\log n)$ times over the whole run, so the total is $O(n \log n)$, which is a respectable answer but not the best one.

The better answer is to stop storing groups and start storing _links_. A student is linked to one other student, who is linked to another, and so on until a representative is reached. The representative is the answer to "which group is this student in", and comparing two representatives answers the membership question. The links are allowed to be long; two tricks keep them short.

## Recognition patterns

A disjoint set union is the right tool when all of the following hold.

- The operations are **merges** and **membership queries**, and nothing ever removes a connection.
- The graph is built **incrementally**, or the queries are known in advance and can be processed offline.
- The question is about **connectivity**, not about the shape of a path.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| Connections are only added | Rules in the disjoint set union |
| Connections are also removed | Rules it out; a dynamic connectivity structure is needed |
| $n, q \le 10^6$ | An $O(n)$ array of parents and sizes is 8 MB, and every operation is amortized $O(1)$ |
| $q \le 10^6$ and a search per query | $O(q(V + E))$ is far too slow; the disjoint set union answers each query in amortized $O(1)$ |
| The graph is a tree | The structure is unnecessary; every vertex is already connected to a known root |

The phrases in a statement that signal this technique are "merge", "union", "are they in the same group", "how many components", "connected by a path of friendships", and "add this road to the network". The phrase that rules it out is "remove", "delete", or "break this connection".

<Synonyms terms="disjoint set union, dsu, union find, mergeable sets, union by size, path compression" />

## Naive approach

The first baseline is to answer each query with a search: run a depth-first search from one of the two elements and see whether the other is reached. This costs $O(V + E)$ per query, so $O(q(V + E))$ in total, which at $q = 10^6$ is hopeless.

The second baseline is the relabeling approach. Keep a label for each group. When two groups merge, change the label of every member of the smaller group.

```python
label = list(range(n))
def unite(a, b):
    if label[a] == label[b]:
        return
    if size[label[a]] < size[label[b]]:
        a, b = b, a
    for v in members[label[b]]:
        label[v] = label[a]
```

This is the same idea as union by size, but it does the work eagerly. Each student is relabeled only when their group is the smaller one, so their group size at least doubles each time they are relabeled, and there are at most $\log_2 n$ doublings. The total is $O(n \log n)$ work, which is correct and often good enough.

The third baseline is to sort the queries and process them offline. That is the right idea for problems with deletions, and the wrong idea here: the disjoint set union answers each query as it arrives, with no sorting and no lookahead.

## Key insight

The insight is that membership is determined by a representative, and that the representative can be reached in a few steps.

Represent the groups by a forest. Each element has a parent pointer, and the roots of the forest are the representatives. Two elements are in the same group exactly when they have the same root, so the membership query is "do these two elements have the same root", and the root can be found by following parent pointers.

Following the pointers naively can take many steps, and there are two independent ways to shorten the walk.

**Path compression.** Whenever a walk goes from $x$ to its root $r$, set the parent of every element on the walk to $r$. The walk is now a single step for that element next time, and for the others on the path as well.

**Union by size.** When two groups merge, attach the smaller group below the representative of the larger group. The height of the tree then grows slowly, because an element's group size at least doubles every time it moves down a level: when it becomes a child, the new tree is at least twice as large as the tree it was in.

Together these two rules make every operation take amortized $O(\alpha(n))$ time, where $\alpha$ is the inverse Ackermann function. Its first values are $\alpha(1) = 1$, $\alpha(2) = 2$, $\alpha(3) = 4$ and $\alpha(4) = 65\,536$, and it grows more slowly than any function you will ever meet in a contest. For every $n$ that fits in a 64-bit word, $\alpha(n)$ is at most four, so the structure behaves as if every operation took constant time.

## Visual intuition

The laboratory below draws the forest. Every element is a node, and the parent pointer of an element is an arrow toward its parent. The roots, the representatives, are drawn at the top of their trees.

A union is an arrow from the root of one tree to the root of another, and the rule that the _smaller_ tree is attached below the _larger_ one keeps the trees shallow. A path compression is a set of arrows that are redrawn to point straight at the root, which is why the picture gets flatter as the run proceeds.

<AlgorithmPlayer algorithm="graphs.dsu" />

## Formal model

Let $X = \{0, 1, \ldots, n-1\}$ be the set of elements.

<MathPanel type="definition" title="Definition">
A **partition** of $X$ is a collection $\mathcal{P}$ of pairwise disjoint
non-empty subsets of $X$ whose union is $X$. The **block** of an element
$x$ under a partition is the unique member of $\mathcal{P}$ that contains
$x$.
</MathPanel>

<MathPanel type="definition" title="Definition">
A **disjoint set union** maintains a partition $\mathcal{P}$ of $X$ and
supports the operations

- $\operatorname{unite}(a, b)$, which replaces the two blocks containing $a$ and $b$ by their union;
- $\operatorname{find}(x)$, which returns the **representative** of the block containing $x$, that is, a fixed element of that block chosen so that every element of the block has the same representative.
</MathPanel>

<MathPanel type="definition" title="Definition">
The structure is stored as a **parent array** $\mathit{parent}$ and a
**size array** $\mathit{size}$. An element $x$ is a **root** when
$\mathit{parent}[x] = x$, and $\mathit{size}[r]$ is the number of elements
in the tree rooted at $r$.
</MathPanel>

<MathPanel type="invariant" title="Invariant">
At every moment, the elements of each tree of the forest are exactly the
elements of one block of the partition, and the root of that tree is the
representative of that block. Path compression preserves this invariant
because it only redraws the arrows inside a tree; a union preserves it
because it merges exactly two trees into one.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If $\mathit{size}$ is maintained correctly and a root $r$ becomes a child
of a root $s$, then the size of the tree rooted at $s$ after the merge is
at least twice the size of the tree rooted at $r$ before the merge.
</MathPanel>

<MathPanel type="lemma" title="Lemma">
If a root always becomes a child of a root whose tree is at least as
large, then the depth of every element in the forest is at most
$\lfloor \log_2 n \rfloor$.
</MathPanel>

## Algorithm derivation

The state is the parent array, initialized with $\mathit{parent}[i] = i$ for every element, and the size array, initialized with $\mathit{size}[i] = 1$. Every element starts in a block of its own, which is the initial partition.

**The find operation.** Walk from $x$ to its root, then walk the path again and point every element on it at the root.

```cpp
int find(int x) {
    int root = x;
    while (parent[root] != root) {
        root = parent[root];
    }
    while (parent[x] != x) {
        const int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}
```

The first loop finds the root, which is the representative of the block containing $x$. The second loop is the compression: it walks the same path and rewrites each arrow to point at the root, so the next walk from any element of the path is a single step.

**The unite operation.** Find the two roots. If they are equal, the elements are already in the same block and nothing changes. Otherwise attach the root of the smaller tree below the root of the larger tree and add the sizes.

The update is correct because the merge of two blocks is exactly what a union does, and the two accelerations preserve the blocks: compression only changes arrows inside one tree, and the merge only joins two trees into one. The size array is what makes the "smaller" decision meaningful, and the lemma above shows why it matters.

**The membership query.** Two elements are in the same block exactly when their representatives are equal, so the answer is $\operatorname{find}(a) = \operatorname{find}(b)$.

## Step-by-step execution

Take six elements $0,1,2,3,4,5$, each starting in a block of its own, with $\mathit{parent}[i] = i$ and $\mathit{size}[i] = 1$.

1. `unite(0, 1)`. The roots are $0$ and $1$, and the sizes are equal, so the smaller tree, the one rooted at $1$, is attached below the root $0$. Now $\mathit{parent}[1] = 0$ and $\mathit{size}[0] = 2$. The blocks are $\{0,1\}$ and the four singletons.
2. `unite(1, 2)`. The find of $1$ walks to $0$ and compresses, so $\mathit{parent}[1] = 0$ still, and the root is $0$. The root of $2$ is $2$, and $\mathit{size}[0] = 2$ is at least $\mathit{size}[2] = 1$, so $\mathit{parent}[2] = 0$ and $\mathit{size}[0] = 3$. The blocks are $\{0,1,2\}$ and the singletons.
3. `unite(3, 4)`. The roots are $3$ and $4$, the sizes are equal, and $4$ is attached below $3$. Now $\mathit{parent}[4] = 3$ and $\mathit{size}[3] = 2$.
4. `same(0, 2)`. The find of $0$ is $0$ and the find of $2$ is $0$, so the answer is yes.
5. `same(0, 3)`. The find of $0$ is $0$ and the find of $3$ is $3$, so the answer is no.
6. `unite(2, 3)`. The find of $2$ is $0$ and the find of $3$ is $3$. The sizes are $3$ and $2$, so the smaller tree, the one rooted at $3$, is attached below $0$. Now $\mathit{parent}[3] = 0$ and $\mathit{size}[0] = 5$. The blocks are $\{0,1,2,3,4\}$ and $\{5\}$.

Note that the find of $1$ in step 2 did not change anything, because the path from $1$ to its root was already of length one. Compression only helps when the path is longer, and it is the union by size rule that keeps the paths short enough for the compression to matter.

## Correctness proof

<MathPanel type="theorem" title="Theorem">
After any sequence of operations, the blocks of the maintained partition
are exactly the connected components of the graph whose edges are the
unions performed so far, and `same(a, b)` returns true if and only if $a$
and $b$ are in the same component.
</MathPanel>

<MathPanel type="proof" title="Proof">
We maintain the following invariant: at every moment, the elements of each
tree of the forest are exactly the elements of one block of the
partition, and the root of the tree is the representative of that block.

Initially every element is a tree of one element, and every block is a singleton, so the invariant holds.

A find operation changes only the arrows inside the tree of the element being searched, and it changes them to point at the root of that tree. Every element of the tree still has that root as its representative, and the tree still holds exactly the same elements, so the invariant is preserved. The value returned is therefore the representative of the block containing the element.

A unite operation finds the roots $r_a$ and $r_b$ of the blocks of the two elements. If $r_a = r_b$, the two elements are already in the same block and the operation changes nothing. Otherwise the operation makes $r_b$ a child of $r_a$, which joins the two trees into one tree whose elements are exactly the union of the two blocks. That is exactly the merge the union is defined to perform, so the invariant is preserved.

The forest and the graph of performed unions are therefore the same partition at every moment: a union adds exactly the edge that joins two components, and the structure merges exactly those two components. Two elements are in the same block exactly when their representatives are equal, which is what `same` tests. $\square$
</MathPanel>

<MathPanel type="lemma" title="Lemma">
The number of blocks of the maintained partition is $n$ minus the number
of unions that actually merged two blocks.
</MathPanel>

<MathPanel type="proof" title="Proof">
Initially there are $n$ blocks, one per element. A union that merges two
blocks reduces the count by exactly one, and a union that finds the two
elements already in the same block reduces it by zero. The count is
therefore $n$ minus the number of merging unions. $\square$
</MathPanel>

## Complexity analysis

**Space: $O(n)$.** The parent array holds $n$ entries and the size array holds $n$ entries, and nothing else is needed. The operations are answered online, so no query list has to be stored.

**Time: $O(\alpha(n))$ amortized per operation**, where $\alpha$ is the inverse Ackermann function. The reasoning is as follows.

With union by size alone, the depth of every element is at most $\lfloor \log_2 n \rfloor$, because a root that becomes a child sees its tree size at least double. So a single find is $O(\log n)$ in the worst case, and the amortized cost of the whole sequence is $O(\log n)$ per operation.

With path compression alone, a find makes the tree flatter, and the amortized cost is also $O(\log n)$ per operation.

With both rules together, the amortized cost is $O(\alpha(n))$ per operation, and the total for a run of $q$ operations on $n$ elements is $O((n + q)\alpha(n))$, including the $O(n)$ initialization.

<MathPanel type="complexity" title="Complexity">
Disjoint set union with union by size and path compression: $O(n)$ space,
$O(\alpha(n))$ amortized time per operation, and $O((n + q)\alpha(n))$ for
a run of $q$ operations on $n$ elements. With union by size alone the
amortized cost is $O(\log n)$; with path compression alone it is also
$O(\log n)$.
</MathPanel>

The value of $\alpha$ in practice: $\alpha(1) = 1$, $\alpha(2) = 2$, $\alpha(3) = 4$ and $\alpha(4) = 65\,536$, and the function grows so slowly that $\alpha(n) \le 4$ for every $n$ that fits in a 64-bit word. For a contest, the practical statement is: the structure is as fast as constant time, and the constant is small.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Groups are merged and queried, never split | Disjoint set union |
| Minimum spanning tree by Kruskal's algorithm | Disjoint set union |
| Number of connected components of a static graph | A search, or a disjoint set union over the edges |
| Connectivity queries on a static graph | One search per source, or one disjoint set union over the edges |
| Connectivity with deletions | Offline processing over a segment tree on time, with a rollback union-find |
| Range updates and point queries | Difference array or Fenwick tree |
| Shortest paths with weights | Dijkstra's algorithm, not a union-find |
| Membership in a set that only grows | A hash table, if only exact membership is needed |

The distinction in the first row is the one that matters. If the question is only "are these two elements in the same set as recorded", and no merges happen, a hash table answers it. The union-find earns its keep when merges happen, because it answers the transitive question: the two elements are in the same set because a chain of merges connects them.

## Reference implementations

<CodeViewer algorithm="graphs.dsu" />

The manifest publishes two variants. The `minimal` variant is a reusable class or structure offering `find`, `unite` and `same` over $n$ elements, with no input and output of its own; in C it owns its storage through an explicit `init` and `destroy` pair, so every successful `init` must be matched by exactly one `destroy`. The `program` variant reads $n$ and $q$, then $q$ operations of the form `1 u v` to merge and `2 u v` to query, and prints `yes` or `no` for each query. An operation that names an element outside $0 \ldots n-1$ is ignored, and such a query answers `no`.

## Recursion decision

The classic recursive form of `find` is short and worth understanding:

```java
public int find(int x) {
    if (parent[x] != x) {
        parent[x] = find(parent[x]);   // compress while unwinding
    }
    return parent[x];
}
```

It is correct, and it compresses the path on the way back up. Whether it is safe depends on the height of the forest, and the height is decided by the union rule.

With union by size, the height is at most $\lfloor \log_2 n \rfloor$, so the recursion depth is at most about $20$ for $n = 10^6$. The recursive form is then perfectly safe, in every language.

Without union by size, the height can be $n$. Consider the calls `unite(0, 1)`, `unite(1, 2)`, ..., `unite(n-2, n-1)`, where each union attaches the _new_ root below the _old_ one. The forest becomes a chain of length $n$, and the recursive find on element $0$ recurses $n$ times.

The language limits decide the answer for that case.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | Iterative find; the chain overflows at $10^6$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative find, and keep union by size |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative find; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative find |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative find |

The recommendation is uniform: write the iterative find. It is the same number of lines as the recursive one, it removes the question entirely, and it removes the possibility that a future edit drops the union by size rule and turns a correct program into a crash.

## Implementation walkthrough

The two-pass find is the heart of the implementation.

```cpp
int root = x;
while (parent[root] != root) {
    root = parent[root];
}
// Every element on the path now points at the root.
while (parent[x] != x) {
    const int next = parent[x];
    parent[x] = root;
    x = next;
}
return root;
```

The first loop finds the root without writing anything. The second loop walks the path again and rewrites each arrow. The two loops are needed because the path is only known once the root has been found.

The union by size rule is a comparison followed by a swap:

```cpp
if (size[root_a] < size[root_b]) {
    std::swap(root_a, root_b);
}
parent[root_b] = root_a;
size[root_a] += size[root_b];
```

The swap is what makes the rule symmetric: after it, the larger root is always the one that stays on top. The size of the new root is updated, and the size of the old root is left alone, because it is now an interior node and its size field is never read again.

The early return in `unite` is not an optimization but a requirement:

```cpp
if (root_a == root_b) {
    return;
}
```

Without it, the union would make a root its own parent, and the find would loop forever on a self-loop. The size accounting would also break, because the size of a block would be added to itself.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting the `root_a == root_b` check | A root becomes its own parent and the find loops forever | Return early when the roots are equal |
| Omitting union by size | The forest can become a chain of depth $n$, and a find costs $O(n)$ | Always attach the smaller tree below the larger |
| Omitting path compression | Still correct, but the amortized cost is $O(\log n)$ | Compress the path on every find |
| Using the rank of a root where the size is expected | The count of elements in a block is wrong | Keep rank and size apart, or keep only one of them |
| Thinking `find(a) == find(b)` implies `a == b` | The converse is what holds | Two different elements may share a representative |
| Using a recursive find with no size rule | A chain of $10^6$ elements overflows the stack | Use the iterative find |
| Scanning all parents to find a representative | Each find costs $O(n)$, so the run costs $O(nq)$ | Follow the parent pointers |
| Expecting a union-find to support deletion | There is no correct answer to give | Use an offline algorithm with a rollback union-find |

### Why this fails: the deletion that cannot be answered

The mistake that survives review most often is using a disjoint set union for a problem in which connections are removed.

Consider three people, $a$, $b$ and $c$, with a friendship between $a$ and $b$ and one between $b$ and $c$. The structure says that all three are in one group, and `same(a, c)` is true.

Now the friendship between $b$ and $c$ is canceled. The question "are $a$ and $c$ in the same group" must now be answered _no_. But the structure has no way to express this. The union of $\{a, b\}$ and $\{b, c\}$ is $\{a, b, c\}$, and a union-find can only ever make sets larger. There is no operation "split these two elements apart", and no sequence of unions can produce the partition $\{\{a,b\}, \{c\}\}$ once the union of $\{a,b,c\}$ has been performed.

The smallest counterexample needs only two elements and one edge: the elements $a$ and $b$ are unioned, so `same(a, b)` is true, and then the edge is removed, so the correct answer is false. The structure still answers true, and it will answer true forever.

The generalization is the assumption in the manifest: **operations are only unions and membership queries, and there is no deletion.** The moment a statement contains a removal, the plain union-find is the wrong tool.

The right tool for deletions is offline processing. The queries are known in advance, so the times at which each edge exists are intervals. Build a segment tree over the timeline, put each edge into the segments its interval covers, and traverse the tree with a union-find that can _undo_ a union. The undo is possible because a union-find operation is a single assignment to the parent array, and the assignment can be undone on the way back up. That is the rollback union-find, and it is the standard answer to offline dynamic connectivity.

### Why this fails: finding a representative by scanning

The second mistake is writing a find that scans the whole array instead of following the parent pointers.

```python
def find(x):
    for i in range(n):
        if parent[i] == x:
            return find(i)
    return x
```

This asks "which element has $x$ as its parent" and recurses on that element. It is wrong twice over.

It is wrong in cost: each call scans $n$ elements, and the recursion can be $n$ deep, so a single find costs $O(n^2)$ and a run of $q$ operations costs $O(n^2 q)$. At $n = q = 10^6$ that is hopeless, and the structure looks efficient only because it is short.

It is wrong in termination: the scan finds an element whose parent is $x$ only when $x$ is not a root. If $x$ is a root, the scan finds nothing and the function returns $x$, which is correct by luck. But if the parent array ever contains a cycle, the scan finds an element and the recursion never ends. A cycle appears exactly when the `root_a == root_b` check is missing, so the two mistakes combine into an infinite loop.

The correct find follows the pointers, and the pointers are arranged so that the walk is short: at most $\log_2 n$ steps with union by size, and one step after a compression.

## Variants and extensions

- **Union by rank.** Instead of the size, each root carries a rank, and the root with the smaller rank becomes the child; when the ranks are equal, one rank is incremented. The trees are no shallower than with sizes, but the size array is not needed, which saves memory.
- **Kruskal's algorithm.** Sort the edges by weight and add an edge when its two ends are not already in the same set, which is decided by `same`. The result is a minimum spanning tree.
- **Rollback union-find.** Record every union on a stack so that it can be undone, and traverse a segment tree over time. This is the standard solution to offline connectivity with deletions.
- **Disjoint set union on a grid.** Treat each cell as an element and each pair of side-adjacent open cells as a union, and then count the blocks. This is a flood fill written with unions, and it gives the components of the grid without a traversal.
- **Small-to-large merging.** Keep a set or a map in each block and merge the smaller into the larger, moving the elements one at a time. Each element moves at most $O(\log n)$ times, so the total is $O(n \log n)$. The union-find is often what tells you which block is smaller.
- **Counting components.** The number of blocks is $n$ minus the number of merging unions, so a count of components needs no traversal at all.
- **Disjoint set union on a tree.** Traverse the tree and merge each vertex with its children, which is how subtree information is gathered when the merges must respect the tree order.

## Contest strategy

Under time pressure, the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Read the statement and look for a removal. If there is one, this is not a plain union-find problem.
2. Decide the data structure before the code: two arrays, `parent` and `size`, and nothing else.
3. Write the find iteratively, with the two passes, and the union with the three steps: find both roots, return if they are equal, attach the smaller below the larger.
4. Count the components as $n$ minus the number of successful merges, rather than counting them at the end.
5. Check the element indices. The reference program ignores an operation that names an element outside the range, and answers such a query with `no`; decide what your program does and make it match the statement.
6. Remember that `find(a) == find(b)` is the membership test, and that `a == b` is not.

## Worked problems

### Problem 1: the friendship groups

**Restatement.** There are $n$ people and $q$ operations. An operation of the form `1 a b` declares that $a$ and $b$ have become friends, and an operation of the form `2 a b` asks whether $a$ and $b$ are in the same group, where a group is a chain of friendships. Constraints: $1 \le n \le 10^6$ and $1 \le q \le 10^6$.

**Naive baseline.** Answer each query with a depth-first search, at a cost of $O(q(V + E))$, and merge by relabeling every member of the smaller group, at a cost of $O(n \log n)$ in total.

**Insight.** The groups are exactly the connected components of the graph of the friendships declared so far, and a representative per component is enough to compare two components.

**Derivation.** Keep a parent array and a size array. `unite(a, b)` finds both representatives, returns if they are equal, and otherwise attaches the smaller block below the larger. `same(a, b)` compares the two representatives.

**Correctness.** The invariant in the correctness proof shows that the blocks of the forest are the connected components of the graph of the declared friendships, so `same` answers exactly the question that is asked.

**Complexity.** $O((n + q)\alpha(n))$ time and $O(n)$ space, with the initialization accounting for the $n$ term.

**Common wrong approach.** Merging without checking whether the two elements are already in the same block. A self-loop in the parent array then makes the find loop forever, and the block sizes are added to themselves.

### Problem 2: the minimum spanning tree, by Kruskal

**Restatement.** A connected undirected graph has $n$ vertices and $m$ edges, each with a weight. Find the total weight of a minimum spanning tree. Constraints: $1 \le n \le 10^5$ and $m \le 3 \cdot 10^5$.

**Naive baseline.** Enumerate the spanning trees, of which there are exponentially many, and take the cheapest. This is not a baseline but a demonstration that the problem needs a structure.

**Insight.** A set of edges forms a forest if and only if no two of its edges close a cycle, and an edge closes a cycle exactly when its two ends are already connected.

**Derivation.** Sort the edges by weight. For each edge in that order, ask the union-find whether its two ends are already in the same block. If they are, skip the edge, because it would close a cycle. If they are not, take the edge, merge the two blocks, and add its weight to the answer. Stop when $n - 1$ edges have been taken.

**Correctness.** The cut property says that an edge of minimum weight across a cut belongs to some minimum spanning tree. The edges the algorithm skips are exactly the edges whose two ends are already connected, so every skipped edge is the heaviest edge on some cycle of the tree built so far and cannot belong to a minimum spanning tree. The accepted edges never form a cycle, so after $n - 1$ of them they form a spanning tree, and the cut property applied at each step shows that a minimum spanning tree exists among the accepted edges.

**Complexity.** Sorting the edges costs $O(m \log m)$, and the $m$ union operations cost $O(m \alpha(n))$, so the total is $O(m \log m)$ time and $O(n + m)$ space.

**Common wrong approach.** Taking the edge whenever it does not create a cycle but never checking whether the graph is already connected, so that the answer is computed on a forest that is not spanning. The loop must run until $n - 1$ edges have been accepted.

### Problem 3: counting the components of a grid

**Restatement.** A field is an $R$ by $C$ grid whose cells are either open or blocked. Two open cells are in the same region if they can be joined by a path of side-adjacent open cells. Report the number of regions. Constraints: $1 \le R, C \le 1000$, so at most $10^6$ cells.

**Naive baseline.** Run a flood fill from every unvisited open cell, which is $O(RC)$ with a good implementation, or $O((RC)^2)$ with the naive one that does not mark the cells as it goes.

**Insight.** A region is a connected component, and connectivity is what the union-find maintains. Merging is even cheaper than a search, because each cell is merged with each of its open neighbors at most once.

**Derivation.** Number the cells from $0$ to $RC - 1$. Create a union-find over them. For every pair of side-adjacent open cells, call `unite` on them. The number of regions is the number of blocks, which is $n$ minus the number of unions that actually merged two blocks.

**Correctness.** Each union joins two cells that are in the same region, and every pair of side-adjacent open cells is unioned, so two cells end up in the same block exactly when a path of open cells joins them. The blocks are therefore the regions, and the count is the number of regions.

**Complexity.** Each cell has at most four neighbors, so there are at most $2RC$ unions, at a total cost of $O(RC \alpha(RC))$ time and $O(RC)$ space.

**Common wrong approach.** Uniting the cell with all of its neighbors including the ones that are blocked or outside the grid, which either corrupts the count or reads outside the array. The neighbor test must be made before the union, not after it.

## Practice progression

1. **Recognition.** Given a statement, decide whether a disjoint set union applies. Look for merges, groups, components, and the absence of removals.
2. **Direct application.** Implement the structure with `find`, `unite` and `same`, and check the answers against a relabeling implementation on small random sequences of operations.
3. **Adaptation.** Implement union by rank, and implement the rollback version that can undo a union.
4. **Combination.** Use the structure inside a larger algorithm, as Kruskal's algorithm does, and use it to decide which block is smaller in a small-to-large merge.
5. **Challenge.** Solve a problem with deletions, using the segment tree over time with a rollback union-find, and see why the plain structure cannot answer it.
6. **Transfer.** Use the structure for problems that only look like connectivity: counting the components of a grid, deciding whether a permutation is a product of cycles, and grouping the elements of a set by the equivalence they induce.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. Why is the answer to "are $a$ and $b$ in the same group" the equality of two representatives rather than a search? (Key insight)
2. State the invariant of the structure and say which operations preserve it. (Correctness proof)
3. Why does union by size bound the depth of the forest by $\lfloor \log_2 n \rfloor$? (Formal model)
4. What is the amortized cost of one operation with both optimizations, with only union by size, and with only path compression? (Complexity analysis)
5. Give a smallest counterexample for a removal, and say why no sequence of unions can produce the correct partition. (Common mistakes)
6. Why is the recursive find safe with union by size and unsafe without it? (Recursion decision)
7. Why is the early return when the two roots are equal a requirement rather than an optimization? (Implementation walkthrough)
8. How is the number of components computed without a traversal, and what is the formula? (Formal model)
9. Which property of the forest would break if the size array were removed, and what would the cost become? (Variants and extensions)
10. Which constraint value rules the structure out entirely, and what structure replaces it? (Recognition patterns)

## Further reading

- The graph representation that a union-find replaces, and the search that answers connectivity on a static graph, are described in [graph representation](/algorithms/graphs/representation) and [depth-first search](/algorithms/graphs/dfs).
- The minimum spanning tree, which is the most common use of the structure, is in [minimum spanning tree](/algorithms/graphs/mst).
- The shortest path algorithms, which need a different structure altogether, are in [Dijkstra's algorithm](/algorithms/graphs/dijkstra) and [Bellman-Ford](/algorithms/graphs/bellman-ford).
- Why a queue and a stack are the two shapes that a graph algorithm takes is covered in [data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
- The rollback union-find, which is what the deletion case needs, is built on the segment tree in [segment tree](/algorithms/range-queries/segment-tree).
- Every listing in this article, in all six languages, is collected on the [disjoint set union source page](/implementations/graphs-dsu).
