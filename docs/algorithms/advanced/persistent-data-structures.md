---
id: advanced.persistent-data-structures
title: Persistent data structures
summary: Keep every version of a structure by copying only the nodes that change, so an old version stays readable while a new version branches from it.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        persistent data structure,
        path copying,
        version,
        persistent stack,
        structural sharing,
        immutability,
        fat node,
        persistent segment tree,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended:
        [range-queries.persistent-segment-tree, range-queries.segment-tree, advanced.rollback-dsu]
complexity:
    time: "O(1) per operation on the persistent stack"
    space: "O(q) for q operations, one node per push"
assumptions:
    - Every operation reads one existing version and derives at most one new version; no version is modified after it is created.
    - A pop of an empty version produces the empty version, so the empty stack never needs an error result.
    - Each value fits in a 32-bit signed integer, and the number of operations q is known before the first version is created.
implementations: advanced.persistent-data-structures
reviewed: false
---

## At a glance

A persistent data structure keeps every version of itself. An update does not overwrite the old state. It creates a new version, and the old version remains readable exactly as it was.

The central economy is **structural sharing**. A stack is a linked list whose state is determined by its head node. Pushing a value allocates one node whose parent is the old head. Nothing else changes. The rest of the list is shared with every version that used it, and because nodes are never modified, sharing is safe.

A version is therefore one integer: the index of its head node. The program keeps an array of these roots, one entry per version. Push, pop, and top all take $O(1)$ time, and $q$ operations allocate at most $q$ nodes. Copying the whole stack instead would cost $O(q^2)$ time and memory in the worst case.

The same idea, applied to a balanced tree, is **path copying**: an update copies the $O(\log n)$ nodes on the root-to-leaf path it changes and shares every other subtree. That is how a persistent segment tree supports $n$ point updates in $O(n \log n)$ nodes while all earlier arrays remain queryable.

## Problem motivation

A document editor keeps a branch for every draft. A writer can open any earlier draft, continue from it, and create a new branch without disturbing the drafts that already exist. The editor cannot store one mutable document and undo changes, because the branches diverge: two writers may push different paragraphs onto the same old draft.

The programming problem has exactly this shape. There are $q$ operations on a stack:

- `1 v x` pushes $x$ onto version $v$ and creates the next version.
- `2 v` pops version $v$ and creates the next version.
- `3 v` prints the top of version $v$, or $-1$ when that version is empty.

Version $0$ is the empty stack. The versions form a tree, not a line: a push or a pop may read any earlier version, so later operations can branch from an old draft while the descendants of that draft continue to exist.

The naive implementation stores the full contents of every version. With $q = 2 \cdot 10^5$ pushes, the total number of stored values is $1 + 2 + \cdots + q$, which is about $2 \cdot 10^{10}$ integers. That does not fit in memory, and copying the stack on every push does not fit in time either.

Offline reordering does not rescue the naive implementation. A query may read any version at any moment, and a version may be created from any earlier version, so there is no single sweep that moves forward through the history. The structure itself has to preserve the past.

## Recognition patterns

Persistence is the right tool when the statement contains some of these phrases.

- "For each version", "after the $i$-th update", "the state after the first $i$ operations".
- "Copy the array", "keep a snapshot", "the old version must remain available".
- "Query any earlier state", "branch from version $v$", "the versions form a tree".
- "Undo an operation, but keep the operations that came after it".
- "The $k$-th smallest in a subarray", with many subarray queries over one static array. Each prefix is a version.
- "The answer to the next query depends on the previous answer", which forbids an offline reordering and forces an online structure.

The constraint values that decide whether persistence is worth its memory:

| Situation | What it rules |
| --- | --- |
| One current state, no history | An ordinary stack or array; persistence is pure overhead |
| Only the most recent operation can be undone | A rollback stack, which pushes the old value and pops it |
| Only the newest version is updated, older versions are read-only | Partially persistent structure; simpler than full persistence |
| Any version may be updated, producing a branch | Fully persistent structure, which is this topic |
| Few versions, or small states | Full copies are simpler and may be fast enough |
| Every version must be kept forever | Persistence fits, but the node pool must be sized for all updates |
| Versions must be deleted when unused | Reference counting or a garbage collector is needed; plain persistence has no free operation |
| The structure is a balanced tree and updates are point updates | Path copying; a persistent segment tree is the standard choice |
| The structure is a balanced tree and updates are range updates | Persistent lazy propagation, which copies two paths and is easy to get wrong |

The second and fourth rows are the ones most often confused. A rollback structure is a stack of modifications: it restores the previous state in last-in-first-out order and cannot branch. A fully persistent structure lets an operation read any old version, so the history is a tree and every node of that tree stays alive.

## Naive approach

The baseline stores a complete copy of the stack in every version.

```cpp
std::vector<std::vector<int>> versions(q + 1);
int created = 0;
for (int i = 0; i < q; ++i) {
    int type, v;
    std::cin >> type >> v;
    if (type == 1) {
        int x;
        std::cin >> x;
        versions[created + 1] = versions[v];
        versions[created + 1].push_back(x);
        ++created;
    } else if (type == 2) {
        versions[created + 1] = versions[v];
        if (!versions[created + 1].empty()) versions[created + 1].pop_back();
        ++created;
    } else {
        std::cout << (versions[v].empty() ? -1 : versions[v].back()) << '\n';
    }
}
```

This is correct, and it is the reference implementation for a differential test on small inputs. Its cost is the problem. A push copies the entire state, so $q$ pushes cost $O(q^2)$ time and space. At $q = 10^5$, that is already five billion element copies.

The second baseline is the operation log. Store every operation, and answer a query for version $v$ by replaying the operations from version $0$ to $v$. The log costs $O(q)$ space, a push or pop still costs $O(1)$ to append, but a top query costs $O(q)$ and $q$ queries cost $O(q^2)$.

That baseline is the right answer when updates are rare and queries are few. It is the wrong answer when the queries dominate, which is the usual case. It is also the baseline that makes the persistent version's advantage easy to measure: the log redoes work that the persistent structure stores once.

## Key insight

The insight is that **a version is fully described by the root of an immutable linked structure, and an update only changes the path from that root to the modified node.**

For a stack, the path has length one. The state is the chain of nodes from the head to the null link. A push creates a new head whose parent is the old head; the old head and everything below it are untouched. A pop does not create a node at all: the new head is the parent of the old head. A top query reads the value in the head.

Immutability is what makes the sharing safe. If a node could be modified, every version that shares it would change, and the old versions would silently become wrong. Because a node is written once, when it is allocated, a node index means the same value and the same parent forever.

The second insight is that **the cost of an update is the length of the changed path, not the size of the structure.** On a linked stack the path is one node, so an update is $O(1)$. On a balanced tree the path is $O(\log n)$, so an update allocates $O(\log n)$ nodes. On an unbalanced tree the path can be $O(n)$, which is why persistent structures are almost always balanced.

The third insight is that **the versions themselves form a tree.** Each new version has exactly one parent version, the version it was derived from. Different children of the same parent are branches. The version tree is the object that the root array materializes, and it is the reason a query for an arbitrary old version is a single array lookup.

## Visual intuition

Start with the empty version and apply six push and pop operations. The sequence is the one used in the trace below.

| Operation | Version created | State   | Nodes allocated |
| --------- | --------------- | ------- | --------------- |
| start     | 0               | empty   | none            |
| `1 0 4`   | 1               | $[4]$   | node 0          |
| `1 1 7`   | 2               | $[4,7]$ | node 1          |
| `1 1 9`   | 3               | $[4,9]$ | node 2          |
| `2 2`     | 4               | $[4]$   | none            |
| `2 0`     | 5               | empty   | none            |

The six versions use only three nodes. Drawing the chains makes the sharing visible. The cell `[4]` is the same node 0 in every row where it appears.

```text
v0 -> null
v1 -> [4] -> null
v2 -> [7] -> [4] -> null
v3 -> [9] -> [4] -> null
v4 -> [4] -> null
v5 -> null
```

The version tree is a different picture, and both pictures are useful:

```text
v0 -- v1 -- v2 -- v4
 |     |
 |     +-- v3
 |
 +-- v5
```

The first picture shows the shared list nodes. The second shows which version was derived from which. A version tree node stores only one integer, the root of its chain; the chains themselves are shared across the tree.

Notice what a pop does in the first picture. Version 2 points at node 1; its parent is node 0. Popping version 2 makes version 4 point at node 0. No node is created, freed, or modified. Version 2 still points at node 1 and still reads $[4,7]$.

## Formal model

Let $\varepsilon$ denote the empty stack and let a stack state be a finite sequence of values. Let the versions be $0, 1, \ldots, m$ in the order they are created, with version $0$ fixed as the empty stack.

::: math definition Definition
A **node** is a pair $u = (\mathit{val}(u), \mathit{par}(u))$, where $\mathit{val}(u)$ is a value and $\mathit{par}(u)$ is either another node or the null link $\bot$. Define the **state** of a node recursively by

$$
\operatorname{state}(\bot) = \varepsilon, \qquad
\operatorname{state}(u) = \operatorname{state}(\mathit{par}(u)) \cdot \mathit{val}(u),
$$

where the dot denotes concatenation. The **root** $r(k)$ of version $k$ is the node at the head of its chain, and the state of version $k$ is $S_k = \operatorname{state}(r(k))$.
:::

::: math definition Definition
A data structure is **persistent** if every update creates a new version and leaves every existing version readable. It is **partially persistent** if only the newest version may be updated. It is **fully persistent** if any version may be updated, so the versions form a tree. The versioned stack in this article is fully persistent.
:::

The operations extend the version sequence by one version each time a push or a pop occurs. Let $m$ be the number of versions created before the operation.

- **Push** of $x$ onto version $k$: allocate a fresh node $u$ with $\mathit{val}(u) = x$ and $\mathit{par}(u) = r(k)$, then set $m' = m + 1$ and $r(m') = u$.
- **Pop** of version $k$: set $m' = m + 1$ and $r(m') = \mathit{par}(r(k))$, with $\mathit{par}(\bot) = \bot$. Popping an empty version therefore produces the empty version.
- **Top** of version $k$: return $\mathit{val}(r(k))$ when $r(k) \ne \bot$, and $-1$ otherwise. A top query does not create a version.

::: math lemma Lemma
For every version $k$, $\operatorname{state}(r(k))$ is exactly the stack state that version $k$ is required to have.
:::

::: math proof Proof
Induct on the version index. Version $0$ has $r(0) = \bot$, and $\operatorname{state}(\bot) = \varepsilon$, which is the required empty stack.

Suppose the claim holds for every version up to $m$, and consider the next operation.

If the operation is a push of $x$ onto version $k$, the new root $u$ satisfies $\mathit{par}(u) = r(k)$, so

$$
\operatorname{state}(u) = \operatorname{state}(r(k)) \cdot x,
$$

which is the old stack with $x$ on top. If the operation is a pop of version $k$, the new root is $\mathit{par}(r(k))$. When $r(k) = \bot$ the new root is $\bot$ and the state is empty. Otherwise the chain of $r(k)$ is the chain of its parent followed by $\mathit{val}(r(k))$, so dropping the last value leaves exactly $\operatorname{state}(\mathit{par}(r(k)))$. A top query creates no version and does not change any root. This proves the claim for the new version when the operation creates one, and a top query leaves every version unchanged, so the induction covers every version. $\square$
:::

::: math lemma Lemma
A push allocates exactly one node, and a pop allocates none. After any sequence of operations, the number of allocated nodes equals the number of pushes.
:::

::: math proof Proof
The push step allocates one node and does not alter any existing node. The pop step writes a root entry and allocates nothing. Top writes no node and no version. Starting from zero nodes, the count rises by one exactly on each push. $\square$
:::

::: math lemma Lemma
If two versions share a node, then the suffixes of their states below that node are identical.
:::

::: math proof Proof
Let node $u$ be reachable from both roots. The suffix below $u$ is $\operatorname{state}(u)$, which is determined by $\mathit{val}(u)$ and $\mathit{par}(u)$. Both fields are written once, when $u$ is allocated, and never changed afterward. Therefore both versions read the same suffix. $\square$
:::

The last lemma is the formal statement of structural sharing. It is also the reason the implementation must never reuse a node index: reusing a slot would change $\operatorname{state}(u)$ for every version that can still reach it.

## Algorithm derivation

The implementation is three flat arrays and two counters.

- `value[u]` holds the value in node $u$.
- `parent[u]` holds the node below $u$, or $-1$ for the null link.
- `root[k]` holds the head node of version $k$, or $-1$ when version $k$ is empty.
- `nodes` is the number of nodes allocated so far.
- `versions` is the number of versions created so far.

Version $0$ is initialized with `root[0] = -1`. Each operation reads its type and its source version $v$. The source version is read before the version counter advances, because the new version must not overwrite the entry it is reading.

- **Push:** write `value[nodes] = x` and `parent[nodes] = root[v]`, then increment `versions` and set `root[versions] = nodes`, then increment `nodes`.
- **Pop:** save `old = root[v]`, increment `versions`, and set `root[versions]` to `-1` if `old == -1` and to `parent[old]` otherwise.
- **Top:** look at `root[v]`. If it is `-1`, print `-1`; otherwise print `value[root[v]]`.

```cpp
std::vector<int> value(q + 1), parent(q + 1), root(q + 1, -1);
int nodes = 0;
int versions = 0;

for (int i = 0; i < q; ++i) {
    int type, v;
    std::cin >> type >> v;
    if (type == 1) {
        int x;
        std::cin >> x;
        value[nodes] = x;
        parent[nodes] = root[v];
        ++versions;
        root[versions] = nodes;
        ++nodes;
    } else if (type == 2) {
        int old = root[v];
        ++versions;
        root[versions] = (old == -1) ? -1 : parent[old];
    } else {
        int top = root[v];
        std::cout << (top == -1 ? -1 : value[top]) << '\n';
    }
}
```

The arrays have length $q + 1$ because at most $q$ pushes occur and at most $q$ versions are created. A push is the only operation that writes a node, and it writes a node that has never been written before. A pop writes only one root entry. No operation ever writes an existing node.

The null link is an index, not a value. Using $-1$ for the null link and allowing $-1$ as a legitimate value would be ambiguous if the two were compared. The program never compares a value with the null link; it compares `root[v]` and `parent[u]`, which are node indexes, with $-1$. A value of $-1$ on top of a non-empty stack is printed as $-1$, which is correct.

The order inside the push is worth checking. `root[v]` must be read before `root[versions]` is written. If the new version counter happened to equal $v$, writing first would destroy the source root. The counter always advances past every existing version, so in a correct run $v \le versions$ and the new slot is fresh, but keeping the read first makes the code robust to an off-by-one in the version bookkeeping.

## Step-by-step execution

Use the sequence from the visual section, with three top queries added at the end.

| Step | Operation | Created version | Source version | Root of new version | State of new version | Output |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `1 0 4` | 1 | 0 | node 0 | $[4]$ |  |
| 2 | `1 1 7` | 2 | 1 | node 1 | $[4,7]$ |  |
| 3 | `1 1 9` | 3 | 1 | node 2 | $[4,9]$ |  |
| 4 | `2 2` | 4 | 2 | node 0 | $[4]$ |  |
| 5 | `2 0` | 5 | 0 | null | empty |  |
| 6 | `3 3` | none | 3 | node 2 | $[4,9]$ | 9 |
| 7 | `3 4` | none | 4 | node 0 | $[4]$ | 4 |
| 8 | `3 5` | none | 5 | null | empty | -1 |

The node table after all eight steps is:

| Node | Value | Parent | Versions whose chain contains it |
| ---- | ----- | ------ | -------------------------------- |
| 0    | 4     | null   | 1, 2, 3, 4                       |
| 1    | 7     | 0      | 2 only                           |
| 2    | 9     | 0      | 3 only                           |

The root array is `[-1, 0, 1, 2, 0, -1]`.

Step 3 is the branch. It reads version 1, whose root is node 0, and allocates node 2 with parent 0. Version 2 already points at node 1 with parent 0, and it is not touched. Both versions 2 and 3 share the suffix `[4]` and differ only in their head node.

Step 4 is the pop. It reads version 2, whose root is node 1, and sets the new root to `parent[1] = 0`. Version 2 remains intact: it still points at node 1 and still reads $[4,7]$. The pop allocated no node.

Step 8 queries an empty version. The root entry is $-1$, so the program prints $-1$ without reading any value. That is different from a non-empty stack whose top value happens to be $-1$; in that case the root entry is a valid node index and the program prints the stored value.

## Correctness proof

::: math theorem Theorem
After every operation, for every existing version $k$, `root[k]` is the head of a chain whose values, read from the null link upward, are exactly the stack state of version $k$. Every earlier version keeps the state it had when it was created.
:::

::: math proof Proof
The proof is the induction of the state lemma, together with an argument that old entries are never changed.

At the start, version $0$ has `root[0] = -1`, which represents the empty stack. Suppose the invariant holds before an operation.

A push reads `root[v]`, allocates a fresh node $u$ with `value[u] = x` and `parent[u] = root[v]`, and writes `root[versions + 1] = u`. The chain of $u$ is the chain of version $v$ followed by $x$, which is the required new state. The fresh node is not reachable from any old root, because old roots were created before $u$ and every parent link points to an older node. No old root entry is written, so every old version keeps its state.

A pop reads `old = root[v]`. If `old = -1`, the new root is `-1` and the new version is empty. Otherwise the new root is `parent[old]`, which is the chain of version $v$ with its last value removed. Again only a fresh root entry is written.

A top query writes nothing. It reads `root[v]`. If the entry is `-1`, the state is empty and the required output is $-1$. Otherwise the root is a node whose value is the last value of the state, which is exactly the top.

The node fields are written only at allocation, so no operation can change a chain that an old version reads. Therefore every earlier version remains correct, and the induction covers all operations. $\square$
:::

The theorem has two independent parts, and both are needed. The first part says that the new version is built correctly. The second says that the old versions are not disturbed. An implementation that copies the stack satisfies the first part but not the complexity bound. An implementation that mutates shared nodes can satisfy the first part for the new version while corrupting an old one, which is the failure discussed in the common mistakes.

## Complexity analysis

| Method                    | Push   | Pop    | Top    | Space    |
| ------------------------- | ------ | ------ | ------ | -------- |
| Copy every version        | $O(s)$ | $O(s)$ | $O(1)$ | $O(q^2)$ |
| Operation log with replay | $O(1)$ | $O(1)$ | $O(q)$ | $O(q)$   |
| Persistent linked stack   | $O(1)$ | $O(1)$ | $O(1)$ | $O(q)$   |

Here $s$ is the current stack size and $q$ is the number of operations.

**Time.** A push writes two node fields and one root field. A pop writes one root field. A top reads one root field and, when the version is non-empty, one value field. Every one of these is a constant number of array operations, so each operation is $O(1)$ and the whole sequence is $O(q)$.

**Space.** Each push allocates one node, and no other operation allocates. The number of nodes is therefore at most the number of pushes, which is at most $q$. The three arrays have $q + 1$ entries each. In C and C++, with 32-bit integers, the total is about $12(q + 1)$ bytes: three arrays of four bytes per entry. At $q = 2 \cdot 10^5$, that is about 2.4 MB.

The comparison with full copying is the point of the technique. With $q$ pushes, full copying stores

$$
1 + 2 + \cdots + q = \frac{q(q+1)}{2}
$$

values. At $q = 2 \cdot 10^5$, that is about $2 \cdot 10^{10}$ values, roughly 80 GB at four bytes each. The persistent version stores $q$ values, a factor of about $10^5$ less.

**Generalization.** Let $T$ be the number of updates and let $L$ be the length of the path that an update changes. Path copying costs $O(L)$ time and allocates $O(L)$ nodes per update, so the total is $O(TL)$ nodes. For a balanced tree, $L = O(\log n)$ and the total is $O(T \log n)$. For the stack, $L = 1$, which is why the stack is the cheapest possible persistent structure.

The root array itself costs one entry per version. If an application creates far more versions than it will ever query, the root entries are wasted, but they are only one integer each and are never the dominant term.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| One current stack, no history | An ordinary stack |
| Undo the most recent operation, last-in-first-out | A rollback stack, or the rollback techniques of a [disjoint set union](/algorithms/graphs/dsu) |
| Read old versions, update only the newest | A partially persistent structure |
| Branch from any version, keep all versions | A fully persistent structure, as in this article |
| Many versions of an array with point updates and range sums | A [persistent segment tree](/algorithms/range-queries/persistent-segment-tree) |
| Many versions of an array with point reads only | A persistent array, by path copying or fat nodes |
| Many versions of a balanced search tree | A persistent treap or another path-copying balanced tree |
| Many versions of a trie, used for prefix queries | A persistent trie |
| Rollback in last-in-first-out order, no branching | A modification stack; persistence is unnecessary |
| Fully persistent connectivity | Much harder than a rollback [disjoint set union](/algorithms/advanced/rollback-dsu); do not assume path copying works |
| A static array with many subarray order-statistic queries | Prefix versions of a [segment tree](/algorithms/range-queries/segment-tree) over compressed values |
| Queries must be answered offline and reordered | A sweep or [parallel binary search](/algorithms/advanced/parallel-binary-search) may be simpler than persistence |

The first three rows are the most common mistakes in selection. Persistence is not the same as undo. Undo only needs the previous state, and a rollback stack restores it in constant time without keeping a version tree. Persistence is not needed when only the newest version is updated either: a partially persistent structure can be simpler, though path copying is usually easy enough that the distinction matters more in theory than in a contest.

The connectivity row is the honest limit. A persistent union-find with path copying would have to copy the parent array, and the array has $n$ entries, so an update would cost $O(n)$. Rollback works because the operations are undone in reverse order, which is exactly the restriction that persistence removes.

## Reference implementations

The six `program` variants implement one contract.

1. Read $q$, the number of operations.
2. Read $q$ operations. Each line is `1 v x`, `2 v`, or `3 v`.
3. Version $0$ is the empty stack. A type-1 or type-2 operation creates the next version, in order. A type-3 operation is a read-only query and does not create a version.
4. For every type-3 operation, print the top value of version $v$, or $-1$ when that version is empty.

The version numbering is the detail to fix before writing any code. The push and pop operations create versions; queries do not. With this rule, the $k$-th push or pop in the input creates version $k$, and every `v` in the input names a version that already exists. The alternative rule, where every input line creates a version, is also self-consistent, but it shifts every version number after the first query. The fixtures and the six programs use the push/pop rule.

The manifest publishes six `program` variants, one per language: `c/program.c`, `cpp17/program.cpp`, `java/Main.java`, `python/program.py`, `pascal/program.pas`, and `javascript/program.js`. There is no reusable `minimal` variant. The structure is three arrays and a loop; a class would hide the arrays without making the version rule or the null-link rule any clearer.

The C variant allocates the three arrays with `malloc` and frees them at the end. The C++ variant uses `std::vector`. Java uses three `int` arrays and a `StreamTokenizer`. Python reads the whole input once and splits it, which keeps the parsing loop out of the interpreter's per-token overhead. Pascal uses dynamic arrays, reads one operation per `ReadLn`, gives every `Read` exactly one argument, and uses no `IOResult`, so it stays inside the subset accepted by pas2js. JavaScript reads the whole input as one string and splits it on whitespace.

All six use $-1$ for the null link and store values separately, so a value of $-1$ is never confused with an empty version. All six print one line per query and produce identical output on the shared fixtures.

## Recursion decision

Every operation in the versioned stack is iterative, and the recursion depth would be at most one even if it were written recursively. The interesting recursion decision belongs to the tree-shaped generalization.

A persistent segment tree update is naturally recursive. Copy the current node, recurse into the child that contains the updated position, and leave the other child pointing at the old subtree. The recursion depth is the height of the tree, which is $O(\log n)$, so a million leaves give about twenty frames.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | About 8 MB of stack | About $10^5$ frames | Recursive updates are safe at $O(\log n)$ depth |
| Java | About $10^4$ frames per thread | About $10^4$ frames | Recursive updates are safe; increase the stack only for unusually deep trees |
| Python | Interpreter limit of 1000 | 1000 frames | Recursive updates are safe at $O(\log n)$, but the interpreter overhead is the real cost |
| Pascal | The operating system stack | Depends on the platform | Recursive updates are safe |
| JavaScript | The V8 engine limit | About $10^4$ frames | Recursive updates are safe |

The recursion to avoid is over the stack itself. A function that copies a stack of size $s$ by recursing once per node has depth $s$, and at $s = 10^5$ it overflows Python's limit and may overflow a Java thread. The iterative root-pointer update avoids that recursion entirely.

The rule is general: **persist the path, not the whole structure.** If the path is short, recursion is fine. If the path can be as long as the structure, write the loop.

## Implementation walkthrough

Five details decide whether the implementation is correct.

**The null link is an index.** Use $-1$ for the null link and keep values in a separate array. If the root array stores node indexes, an empty version is `-1` and a non-empty version with top value $-1$ is a valid node index. Comparing the top value with $-1$ instead of checking the root is the classic confusion.

**Read the source root before writing the destination.** A push needs the old root of version $v$ as the parent of the new node. Save it in a local before changing `root[versions]`:

```cpp
int old = root[v];
value[nodes] = x;
parent[nodes] = old;
```

The version counter always advances to a fresh slot, so the read order is technically safe, but the local makes the dependency explicit and survives a later change to the version rule.

**Never write an existing node.** A push appends at `nodes` and then increments. A pop writes no node. A query writes nothing. The moment a program writes `value[u]` or `parent[u]` for a node that some version can still reach, persistence is broken. This is the single invariant that the rest of the design depends on.

**Advance the version counter only when a version is created.** In this contract a type-3 query does not create a version. Advancing the counter on a query shifts every later version number and makes the input's `v` values point at the wrong states. Write the rule in a comment or, better, in the problem statement, and test a sequence that mixes queries with updates.

**Guard the pop of an empty version.** `parent[-1]` is not a valid array access. Check the root before following it. The statement says version $0$ is empty, and a pop of an empty version is a legitimate operation in the fixtures.

A compact Python core is:

```python
import sys

tokens = iter(sys.stdin.buffer.read().split())
q = int(next(tokens))

root = [-1] * (q + 1)
value = [0] * (q + 1)
parent = [-1] * (q + 1)
nodes = 0
versions = 0

for _ in range(q):
    kind = int(next(tokens))
    v = int(next(tokens))
    if kind == 1:
        x = int(next(tokens))
        value[nodes] = x
        parent[nodes] = root[v]
        versions += 1
        root[versions] = nodes
        nodes += 1
    elif kind == 2:
        old = root[v]
        versions += 1
        root[versions] = -1 if old == -1 else parent[old]
    else:
        top = root[v]
        print(-1 if top == -1 else value[top])
```

The Python version keeps the same three arrays and the same invariants. The only difference is that the lists are allocated with the known bound $q + 1$ instead of being grown one node at a time.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Overwriting the head node on a push | Every version that shares the head changes | Allocate a fresh node and point it at the old head |
| Freeing a node on a pop | A later push reuses the slot and an old version changes | Never free a node; a pop writes only a root entry |
| Advancing the version counter on a query | Later `v` values name the wrong versions | Create versions only on push and pop |
| Using $0$ as both node index and empty sentinel | Node $0$ is confused with the empty stack | Use $-1$ for the null link |
| Comparing the top value with $-1$ | A legitimate value of $-1$ is reported as empty | Compare `root[v]` with the null link, not `value[root[v]]` |
| Walking the chain to find the top | A top query costs $O(q)$ and the run is $O(q^2)$ | Store the value in the head node |
| Copying the whole chain on a push | The run is $O(q^2)$ in time and space | Copy only the new head; share the rest |
| Allocating $q$ root entries but only $q - 1$ node entries | The last push writes out of bounds | Size both arrays at $q + 1$ |
| Forgetting that pop creates a version | The version numbering drifts | A pop writes a new root entry even though it allocates no node |
| Assuming persistence supports deletion | A freed version is still reachable from an old root | Keep every version, or add reference counting |

### Why this fails: overwriting a shared node

The plausible wrong approach is to treat the version root as a handle to a mutable stack and to "push" by changing the head. After all, the new version and the old version share almost everything, so changing just the head seems cheap.

Take three operations. Push $4$ onto version $0$ to get version $1$, then push $7$ onto version $1$ to get version $2$. Now push $9$ onto version $1$. The correct result is version $1 = [4,9]$ and version $2 = [4,7]$.

The in-place implementation writes $9$ into the node that version $1$ already uses for $4$. Version $1$ becomes $[9]$, and version $2$ becomes $[9,7]$, because its head still points at the overwritten node. Both answers are wrong, and the bug is invisible if the test only ever pushes onto the newest version.

A second counterexample involves a node reused between a push and its child. Push $4$ to get version $1$, then push $9$ onto version $1$ to get version $2$, and push $9$ onto version $2$ to get version $3$. The two nodes holding $9$ must have different parents. The first points at version $1$'s node, and the second points at version $2$'s node. If the implementation reuses one node for both, versions $2$ and $3$ cannot both be right, because one node cannot hold two different parents.

Another failure is freeing a node on pop. Versions $1 = [4]$ and $2 = [4,7]$ exist; pop version $2$ to get version $3 = [4]$. If the pop frees the node holding $7$, a later push onto version $1$ may allocate that same node for $9$, and version $2$ silently becomes $[4,9]$. The pop must write a root entry and nothing else.

Both failures have the same root cause: a node was treated as mutable state instead of as an immutable fact. The rule that prevents them is simple enough to check mechanically: **after a node is allocated, no code ever writes to it again.**

A third failure is the version counter. Suppose the input mixes queries and updates, and the program increments the counter on every line, including a type-3 query. If the first operation is a query and the second is a push, the push writes version 2 while the input calls it version 1. Every later reference is off by the number of queries seen so far. The failure is systematic and easy to miss because the first few queries, which read version 0, still work.

## Variants and extensions

- **The persistent segment tree.** The standard generalization. Each node stores a left child, a right child, and an aggregate. A point update copies the root-to-leaf path, so it allocates $O(\log n)$ nodes and shares every subtree that does not contain the update. Version roots are stored per update. A range query on one version is the ordinary segment tree query; a range query between two versions subtracts their aggregates, which is how the prefix-version trick answers order-statistic queries.
- **Persistent arrays by fat nodes.** Instead of copying the path, each array cell stores a list of `(version, value)` modifications. A read binary-searches the list for the latest entry at or before the requested version; a write appends one entry. A lookup costs $O(\log m)$ and a write costs $O(1)$ amortized, against $O(\log n)$ for both in path copying. Fat nodes are preferable when writes are much more frequent than reads, and path copying is preferable when reads dominate.
- **Partial, full, and confluent persistence.** Partial persistence allows updates only on the newest version, so the versions form a line. Full persistence allows updates on any version, so they form a tree. Confluent persistence also allows two versions to be merged into a new version, which is substantially harder because the merged structure can share nodes in both directions. The versioned stack is fully persistent.
- **Persistent treaps and balanced trees.** A treap update copies the nodes on the search path, and a split or merge copies the nodes it touches. The expected depth is $O(\log n)$, so the expected cost is $O(\log n)$ nodes per update. The same shape works for a persistent red-black tree or a persistent AVL tree, with a larger constant.
- **Persistent tries.** Inserting a string copies the nodes on its path and shares every other branch. Prefix versions of a trie answer maximum-XOR queries over a prefix, because each prefix has its own root and the binary trie below it is shared.
- **Rollback versus persistence.** A rollback structure stores the changes needed to undo the most recent update, so it uses $O(1)$ extra space per update and supports only last-in-first-out undo. It is the right tool for an offline traversal that enters and leaves states, such as the [rollback disjoint set union](/algorithms/advanced/rollback-dsu). Persistence keeps every version and supports arbitrary reads, at the cost of an explicit node pool.
- **Copy-on-write.** A hybrid in which versions share an array until one of them writes. Writes copy the shared block or the whole array. It is simpler than a node pool but gives weaker worst-case bounds, because a write to a heavily shared block can copy everything.
- **Memory reclamation.** Plain persistence never frees a node, because an old version may still reach it. Reference counting can free a version subtree when no root references it, and a garbage collector does the same automatically. Contest solutions usually skip reclamation and size the pool for every operation.

## Contest strategy

1. Decide which kind of persistence the problem needs. If the operations are undone in reverse order, use a rollback structure. If only the newest version is updated, partial persistence is enough. If any version can branch, plan for full persistence.
2. Count the updates before allocating. A path-copying structure allocates one node per changed path entry, so the node pool is the number of updates times the path length, not the number of queries.
3. Use integer indexes rather than pointers. The pool is then one or more flat arrays, the nodes are cache-friendly, and the code has no allocator or garbage collector in the hot loop.
4. Write the version numbering down. In the stack problem, push and pop create versions and queries do not. In a prefix-version segment tree, version $i$ is the state after the first $i$ insertions. An off-by-one in this rule produces wrong answers that look like structural bugs.
5. Build version $0$ explicitly. It is the empty stack, the empty tree, or the array before any update. Every later version must be derivable from it by the same path-copying rule.
6. Keep a full-copy reference implementation for small tests. Random sequences with many branches and empty pops find sharing bugs that hand-written tests miss. Compare the persistent output with the reference on thousands of tiny cases.
7. Estimate the memory. For a persistent segment tree, the pool is about $T \log n$ nodes, and each node holds two child indexes and an aggregate. At $T = 2 \cdot 10^5$ and $\log n \approx 18$, that is about 3.6 million nodes, which is usually fine but worth checking against the limit.

## Worked problems

### Problem 1: the widest sign at a threshold height

**Restatement.** There are $n$ fence panels with heights $h_i$. A query gives $l$, $r$, and $w$, and asks for the largest height $H$ such that some $w$ consecutive panels in $[l, r]$ all have height at least $H$. The number of panels and queries reach $10^5$.

**Naive baseline.** For each query, sort the heights in the range or scan every candidate height, and for each candidate scan the range for a run of $w$ panels. The cost is at least $O(n)$ per query, and a binary search over heights with a linear check costs $O(n \log H)$ per query.

**Insight.** Fix a height threshold $H$ and mark each panel whose height is at least $H$. The query is feasible exactly when the marked positions contain a run of $w$ consecutive panels inside $[l, r]$. As $H$ decreases, more panels are marked, so feasibility is monotone. A persistent segment tree can store the marked set for every distinct height.

**Derivation.** Sort the distinct heights from largest to smallest. Start with every panel unmarked. For each height in that order, mark all panels of that height and create a new version. Each version is a segment tree over the panel positions whose nodes store the longest marked prefix, the longest marked suffix, and the longest marked run in the node's interval. A range query combines those three values over $[l, r]$ and returns the longest run. Binary search the largest threshold whose version has a run of at least $w$, and output that height.

**Correctness.** In the version for height $H$, a position is marked exactly when its panel height is at least $H$. A run of $w$ marked positions in $[l, r]$ is exactly a placement of the sign of width $w$ at height $H$. Feasibility is monotone: lowering $H$ cannot unmark a panel and cannot destroy a run. The binary search therefore finds the largest feasible height.

**Complexity.** The building phase performs $n$ point updates, each copying $O(\log n)$ nodes, so it costs $O(n \log n)$ time and space. A query binary-searches $O(\log n)$ versions and performs one range query per step, for $O(\log^2 n)$ time. The total is $O((n + q) \log^2 n)$ time and $O(n \log n)$ space.

**Common wrong approach.** Rebuilding the marked segment tree for every query, which turns the build cost into a per-query cost. A second wrong approach binary-searches the height but checks a run with a fresh scan of the range, which is $O(n \log n)$ per query.

### Problem 2: the fewest squads with at most k colors

**Restatement.** An array of $n$ colors must be split into the minimum number of contiguous squads, each containing at most $k$ distinct colors. The answer is required for every $k$ from $1$ to $n$, with $n \le 10^5$.

**Naive baseline.** For each $k$, scan the array from left to right, keep a frequency table, and close a squad when a new color would exceed $k$. Each scan is $O(n)$, so all $k$ cost $O(n^2)$. A variant that binary-searches the end of every squad with a freshly built frequency structure costs $O(n^2 \log n)$.

**Insight.** For a fixed $k$, the greedy farthest jump is optimal: from the current start, take the longest prefix with at most $k$ distinct colors. The end of that prefix is one position before the $(k+1)$-th distinct color in the remaining suffix. A persistent segment tree can find the first occurrence of each distinct color in every suffix and support a "position of the $j$-th mark" query.

**Derivation.** Build a version for every start position $l$, working from right to left. Version $l$ marks the first occurrence of each color in $a[l \ldots n]$. To build it, start from version $l + 1$, remove the mark at the next occurrence of $a[l]$ if that occurrence exists, and add a mark at $l$. Each change copies one root-to-leaf path. For a fixed $k$ and current start $l$, find the position of the $(k+1)$-th mark in version $l$; the current squad ends just before it, and the next squad starts there. If there is no $(k+1)$-th mark, the remaining suffix is the last squad.

**Correctness.** Greedy is optimal by an exchange argument. Suppose an optimal partition takes a first squad that ends at $e'$ before the farthest valid end $e$. Extending that squad to $e$ still has at most $k$ distinct colors and cannot increase the number of squads, because the next squad can only start later. Repeating the argument makes every squad the farthest valid one. The mark at position $p$ in version $l$ is exactly the first occurrence of its color in $a[l \ldots n]$, so the $(k+1)$-th mark is the first position where the distinct count would exceed $k$. The jump is therefore the farthest valid end.

**Complexity.** Each version performs at most two point updates, each copying $O(\log n)$ nodes, so the build costs $O(n \log n)$ time and space. For a fixed $k$, every non-final squad contains at least $k$ positions, so there are at most $n/k + 1$ jumps. Summing over $k$ gives $O(n \log n)$ jumps, and each jump performs one $j$-th-mark query in $O(\log n)$. The total is $O(n \log^2 n)$ time and $O(n \log n)$ space.

**Common wrong approach.** Marking every occurrence of a color rather than the first occurrence in the suffix. Then the $(k+1)$-th mark is the $(k+1)$-th occurrence, not the $(k+1)$-th distinct color, and the jump is too short. A second wrong approach rebuilds the distinct-color structure for every jump, which loses the harmonic saving.

### Problem 3: the minimum value in a depth-limited subtree

**Restatement.** A tree is rooted at $r$, and every vertex $x$ has a value $a_x$. A query gives $x$ and $k$ and asks for the minimum value among vertices $y$ in the subtree of $x$ with distance $d(x, y) \le k$. The queries are decoded with the previous answer, so they must be answered online. The tree has $10^5$ vertices and there can be $10^6$ queries.

**Naive baseline.** For each query, traverse the subtree of $x$ down to depth $k$ and take the minimum. A star or a chain makes the traversal $O(n)$ per query. Precomputing the minimum for every pair $(x, k)$ costs $O(n^2)$ time and space.

**Insight.** An Euler tour turns every subtree into one contiguous interval. The distance condition becomes a depth condition: a vertex $y$ in the subtree of $x$ is at distance at most $k$ exactly when its depth is at most $\operatorname{depth}(x) + k$. If version $d$ of a segment tree contains every vertex of depth at most $d$, keyed by its Euler position, then the query is a range minimum on version $\min(\operatorname{depth}(x) + k, D)$, where $D$ is the maximum depth.

**Derivation.** Compute the Euler entry and exit times and the depth of every vertex with one DFS. Group the vertices by depth. Build version 0 as the all-infinity tree. For $d = 1, \ldots, D$, take version $d - 1$ and set the Euler position of every vertex at depth $d$ to its value, using a persistent point update with a minimum aggregate. To answer $(x, k)$, let $d = \min(\operatorname{depth}(x) + k, D)$ and query version $d$ over the interval from the entry time of $x$ to its exit time.

**Correctness.** Version $d$ contains exactly the vertices of depth at most $d$, because each depth layer is inserted once and versions never remove a vertex. The Euler interval of $x$ contains exactly the vertices in the subtree of $x$. A vertex in that interval is at distance at most $k$ from $x$ exactly when its depth is at most $\operatorname{depth}(x) + k$. The range minimum over the intersection is therefore the required answer.

**Complexity.** The DFS is $O(n)$. Each vertex causes one persistent point update of $O(\log n)$, so the build costs $O(n \log n)$ time and space. A query is one range minimum on one version, which is $O(\log n)$. The total is $O((n + m) \log n)$ time and $O(n \log n)$ space, which fits $m = 10^6$ with a fast input reader.

**Common wrong approach.** Building version $d$ from only the vertices exactly at depth $d$. Then a query at depth limit $d$ misses all shallower vertices in the subtree, including the root of the subtree itself. The versions must be cumulative. A second wrong approach drops the Euler interval and queries the whole version, which can return a vertex outside the subtree.

## Practice progression

1. **Recognition.** Given a statement, decide whether it needs rollback, partial persistence, or full persistence. Name the versions and say which operations create them.
2. **Direct application.** Implement the persistent stack with a root array and three node arrays. Compare it against a full-copy implementation on random small sequences with branches and empty pops.
3. **Adaptation.** Replace the stack by a persistent segment tree with point updates and range sums. Verify that version $i$ differs from version $i - 1$ by exactly one updated position.
4. **Combination.** Answer the $k$-th smallest value in a subarray by walking two prefix-version roots together. Check the count difference at every step.
5. **Challenge.** Solve a problem where the persistent structure is built over a derived array, such as first occurrences in a suffix or the previous occurrence of each value, and the query is a position of a mark rather than a range sum.
6. **Transfer.** Apply path copying to a trie for prefix maximum-XOR queries, or to a treap for order-statistic splits. Notice that the root array and the copy-the-path rule do not change; only the node fields and the aggregate do.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is the difference between a rollback structure and a persistent one? (Recognition patterns)
2. Why is it safe to share nodes between versions? (Key insight)
3. What exactly does a push allocate, and what does a pop allocate? (Formal model)
4. State the state-of-a-node definition and explain why it makes the correctness proof an induction. (Formal model)
5. Why can a node never be freed or overwritten? (Common mistakes)
6. What is the smallest sequence that exposes an in-place push, and what does the buggy program print? (Common mistakes)
7. Why must a top query not advance the version counter in this problem's numbering? (Reference implementations)
8. What is the cost of one stack operation, and what is the total number of nodes after $q$ operations? (Complexity analysis)
9. How does path copying generalize from a stack to a segment tree, and what is the cost per update? (Variants and extensions)
10. In the depth-limited subtree problem, why must version $d$ be cumulative rather than contain only depth $d$? (Worked problems)

## Further reading

- The subject index places this technique beside the other [advanced algorithms](/algorithms/advanced/), including the offline techniques that solve problems persistence cannot reorder.
- The standard tree-shaped persistent structure is the [persistent segment tree](/algorithms/range-queries/persistent-segment-tree), which applies path copying to the [segment tree](/algorithms/range-queries/segment-tree).
- The rollback alternative, which keeps only the changes needed to undo the latest update, is the [rollback disjoint set union](/algorithms/advanced/rollback-dsu).
- The offline alternative for many monotone queries over one structure is [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The prefix sums that the persistent stack replaces with a chain are in the [Fenwick tree](/algorithms/range-queries/fenwick-tree), and the search that orders the versions is in [binary search](/algorithms/searching/binary-search).
- The compression that turns arbitrary values into segment tree indexes is in [coordinate compression](/algorithms/arrays/coordinate-compression).
- The cost model that separates $O(1)$ updates from $O(q)$ copies is in [complexity](/algorithms/foundations/complexity).
