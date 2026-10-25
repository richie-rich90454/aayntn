---
id: advanced.rollback-dsu
title: The rollback disjoint set union
summary: Keep the merge history of a union-find on a stack and undo merges in constant time, so an offline traversal can explore nested states without rebuilding the partition.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        rollback,
        undo,
        union-find,
        disjoint set union,
        offline dynamic connectivity,
        segment tree over time,
        divide and conquer,
    ]
prerequisites:
    required: [graphs.dsu]
    recommended:
        [advanced.parallel-binary-search, range-queries.segment-tree, foundations.complexity]
complexity:
    time: "O(log n) per find or union, O(1) per rollback"
    space: "O(n + q) for the forest and its history"
assumptions:
    - The operations are known in advance and the states are explored in a nested, last-in-first-out order, so every merge is undone before an older merge.
    - Path compression is disabled, so one merge changes only the parent of one root and the size of the other.
implementations: advanced.rollback-dsu
reviewed: false
---

<AlgorithmSummary algorithm="advanced.rollback-dsu" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="advanced.rollback-dsu" />

## At a glance

A rollback disjoint set union is an ordinary union-find with one rule removed and one array added. The rule is path compression: it never runs. The array is a stack of merge records, and popping the stack restores the partition to the state before the corresponding merge.

The structure is used when the partition has to move through a tree of states rather than forward through time. A depth-first traversal of a segment tree over the timeline merges edges on the way down and undoes them on the way back. The undo is the whole point: a plain union-find cannot delete an edge, because merging two sets destroys the information about which elements were in which set.

Keeping the trees shallow is the job of union by size. Without path compression, a find follows parent pointers, and a merge that always attaches the smaller tree under the larger keeps the depth at most $\lfloor \log_2 n \rfloor$. A merge changes exactly two array entries, the parent of the smaller root and the size of the larger root, so one frame is enough to reverse it.

For $q$ operations on $n$ elements the program costs $O(q\log n)$ time and $O(n+q)$ space. In the offline applications the multiply is larger, but the rollback itself stays $O(1)$ per frame.

## Problem motivation

A city is building roads. The road network is described by an undirected graph, and over time roads are opened and closed. After every event the planning office wants to know how many connected components the network has, or whether two given districts are connected.

A plain disjoint set union answers the connectivity question beautifully while roads are only opened. Each opening is one merge, and the component count is one counter that decreases on every successful merge. Closing a road breaks the structure. The union-find has forgotten which edges produced the merge, and even if it remembered them, it has no way to split a set back into the two pieces that were joined.

The naive repair is to rebuild the structure for every event. With $n$ vertices, $m$ edges and $k$ events that costs $O(k(n + m\log n))$, which is far too slow for $n, m, k$ around $10^5$.

The problem is offline: every event is in the input, so the whole timeline is known before the first answer is produced. Each road exists during an interval of time. The timeline can be cut into a segment tree, each road is stored in the nodes whose ranges it spans, and the answers are read at the leaves. A root-to-leaf path holds the roads that are alive at that leaf.

That traversal needs a structure that can be pushed on the way down and popped on the way back. The push is a merge, and the pop is an undo. The rollback disjoint set union is exactly that structure.

## Recognition patterns

The rollback union-find is the right tool when the statement contains some of these phrases.

- "Edges are added and removed", "the graph changes between queries", "after each event".
- "The operations are given in advance", "answer all queries offline", "process the queries in any order".
- "Undo the last operation", "restore the previous state", "backtrack over the choices".
- "Divide and conquer over the timeline", "segment tree on time", "each edge is active on an interval".
- "For each query, test a set of edges", with the test being a connectivity or bipartiteness check.
- "The graph is bipartite after removing a range of edges", which is a parity union-find with undo.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| Only merges, no deletions, queries online | A plain union-find with path compression |
| Deletions, but every query can be answered from scratch | Rebuild; the rollback machinery is overhead |
| Deletions and the states form a tree | A rollback union-find |
| Edges have lifetimes and answers are wanted at every time | A segment tree over time plus a rollback union-find |
| Deletions and the queries are online | A dynamic connectivity structure such as a link-cut tree |
| The check is a count of connected components | A rollback union-find with a component counter |
| The check is bipartiteness or parity | A rollback union-find that stores the parity to the parent |
| The state has to be kept for every version, not just the current path | A persistent union-find, not a rollback one |
| A query depends on the answer of an earlier query | No offline transformation applies |

The fourth row is the standard application, and the fifth row is its honest limit. Rollback is a stack, not a history of every version: it can return to an ancestor state, not to an arbitrary earlier state. If the problem asks for the structure at any time in any order, a persistent or fully dynamic structure is the right object.

## Naive approach

The baseline rebuilds the whole structure for every state that needs an answer.

```cpp
for (const State& state : states) {
    reset();                                    // O(n)
    for (int e = 0; e < state.edge_count; ++e) {
        unite(state.edge_u[e], state.edge_v[e]); // O(m log n)
    }
    answer[state.id] = components;
}
```

This is correct, and it is the reference implementation for a differential test on small inputs. Its cost is $O(S(n + m\log n))$ for $S$ states, and in the offline connectivity problem $S$ is the number of leaves, which can be as large as the number of events.

The second baseline snapshots the two arrays before every merge and restores them by copying.

```cpp
std::vector<int> saved_parent = parent;
std::vector<int> saved_size = size;
unite(u, v);
// later:
parent = saved_parent;   // O(n) per undo
size = saved_size;
```

This is correct as well, and it is the baseline that makes the point. The merge itself is cheap, but the undo copies $O(n)$ entries. A traversal that performs $m\log T$ merges therefore pays $O(nm\log T)$ for the undos alone, which is worse than rebuilding in many cases.

The third baseline is to recompute the partition with a breadth-first search at every leaf. Its cost is $O(T(n+m))$, and it has the same defect: the work of one state is thrown away when the next state is visited.

## Key insight

The insight is that **one merge changes only two array entries, provided that path compression never runs.**

When two roots are merged, one root stops being a root. Its parent pointer changes from itself to the other root. The other root keeps its parent pointer and grows its size. No other entry changes, because the elements below the two roots still point to the same parents they pointed to before.

Path compression is what breaks this. A find that compresses a path rewrites the parent pointers of every node on the path. Those rewrites are invisible to the merge record: they happen after the merge, possibly much later, and a frame that stores one parent pointer cannot undo them. Worse, a compressed pointer can cross the cut that a later rollback creates, which silently joins two components that should be separate.

So the design is a trade: give up path compression, keep union by size, and pay $O(\log n)$ per find instead of the inverse Ackermann bound. In exchange, every merge is reversible by restoring two cells.

The second half of the insight is the order. The states of an offline traversal are nested: the edges at a deep node are a superset of the edges at its parent, and the traversal leaves the node before it visits an unrelated branch. That is exactly a stack discipline. Push a frame on the way down, pop it on the way back, and the partition is always the one belonging to the current root-to-node path.

## Visual intuition

Take four elements and three merges. Each row shows the parent array and the size array after the operation. The roots are the positions where the parent equals the index.

| State     | parent  | size    | History stack                                     |
| --------- | ------- | ------- | ------------------------------------------------- |
| start     | 1 2 3 4 | 1 1 1 1 | empty                                             |
| union 1 2 | 1 1 3 4 | 2 1 1 1 | $(2 \to 1,\ 1)$                                   |
| union 3 4 | 1 1 3 3 | 2 1 2 1 | $(2 \to 1,\ 1)$, $(4 \to 3,\ 1)$                  |
| union 2 4 | 1 1 1 3 | 4 1 2 1 | $(2 \to 1,\ 1)$, $(4 \to 3,\ 1)$, $(3 \to 1,\ 2)$ |
| rollback  | 1 1 3 3 | 2 1 2 1 | $(2 \to 1,\ 1)$, $(4 \to 3,\ 1)$                  |

The third merge is the interesting one. The roots are $1$ and $3$, the two sizes are equal, so the tie is broken by attaching the second root under the first. The frame records that element $3$ became a child of $1$, and that the size of $1$ was $2$ before the merge. The rollback restores exactly those two facts.

Picture the forest instead of the array. Before the last merge there are two trees:

```text
    1          3
    |          |
    2          4
```

After the merge there is one tree, and the only new edge is the edge from $3$ to $1$:

```text
      1
     / \
    2   3
        |
        4
```

The rollback deletes the edge from $3$ to $1$, which splits the tree back into the two trees above. Nothing else has to move, because no other edge was created or destroyed. That is why a single frame is enough.

## Formal model

Let $U = \{1, 2, \ldots, n\}$ be the universe. A **partition** of $U$ is a collection of nonempty, pairwise disjoint sets whose union is $U$.

::: math definition Definition
A **union-find state** consists of two functions on $U$:

- a parent function $p : U \to U$ such that the directed graph with edges $v \to p(v)$ is a forest of rooted trees, and $p(v) = v$ exactly for the roots;
- a size function $s : U \to \mathbb{Z}_{\ge 1}$ that equals the number of vertices in the subtree of $v$ when $v$ is a root, and is unspecified for a non-root.

The **representative** of $v$, written $\operatorname{find}(v)$, is the root reached by following $p$ from $v$. Two elements are in the same set exactly when their representatives are equal.
:::

::: math definition Definition
A **merge record** is a triple $(c, r, s_0)$ with the following meaning: $c$ was a root, $r$ was a root, $s_0$ was the size of $r$ before the merge, and the merge set $p(c) = r$ and $s(r) = s(r) + s(c)$. The **history** is a stack of merge records.
:::

::: math definition Definition
Given a state and roots $a \ne b$, the operation $\operatorname{merge}(a, b)$ acts as follows. If $s(a) \ge s(b)$ it records $(b, a, s(a))$, sets $p(b) = a$ and $s(a) = s(a) + s(b)$. Otherwise it records $(a, b, s(b))$, sets $p(a) = b$ and $s(b) = s(b) + s(a)$. The operation **rollback** pops the top record $(c, r, s_0)$ and sets $p(c) = c$ and $s(r) = s_0$.
:::

The following invariant is maintained by every operation.

1. The parent pointers form a forest, and every non-root points to a vertex in its own set.
2. For every root $r$, $s(r)$ equals the number of vertices in its tree.
3. The history stack lists the merges that produced the current state, in the order they were applied.

::: math lemma Lemma
With union by size and no path compression, the depth of any vertex in its tree is at most $\lfloor \log_2 n \rfloor$.
:::

::: math proof Proof
When a root $c$ is attached under a root $r$, the size of $r$ is at least the size of $c$, so the tree containing $r$ after the merge has at least twice as many vertices as the tree rooted at $c$ had. Every time the depth of a vertex increases by one, the size of the tree containing it at least doubles. A tree has at most $n$ vertices, so the depth can increase at most $\lfloor \log_2 n \rfloor$ times. $\square$
:::

::: math lemma Lemma
A rollback on a state produced by a merge restores the parent and size functions to the state immediately before that merge.
:::

::: math proof Proof
Suppose the merge recorded $(c, r, s_0)$. Before the merge, $p(c) = c$, $p(r) = r$, $s(r) = s_0$, and no other entry was touched. After the merge, the only differences are $p(c) = r$ and $s(r) = s_0 + s(c)$. Setting $p(c) = c$ and $s(r) = s_0$ restores both entries to their previous values. Every other entry already has its previous value, because the merge did not change it. $\square$
:::

## Algorithm derivation

The structure has three operations: find, merge and rollback. The reference implementation stores the two arrays and the history stack in one class.

```cpp
class RollbackDsu {
public:
    explicit RollbackDsu(int n) : parent(n + 1), size(n + 1, 1) {
        for (int v = 1; v <= n; ++v) parent[v] = v;
    }

    int find(int v) const {
        while (parent[v] != v) v = parent[v];
        return v;
    }

    void unite(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) {
            history.push_back({0, 0, 0});   // a union command that merged nothing
            return;
        }
        if (size[ra] < size[rb]) std::swap(ra, rb);
        history.push_back({rb, ra, size[ra]});
        parent[rb] = ra;
        size[ra] += size[rb];
    }

    void rollback() {
        if (history.empty()) return;
        Frame frame = history.back();
        history.pop_back();
        if (frame.child == 0) return;       // the marker of a redundant union
        parent[frame.child] = frame.child;
        size[frame.root] = frame.old_size;
    }

    bool same(int a, int b) const { return find(a) == find(b); }

private:
    struct Frame { int child, root, old_size; };
    std::vector<int> parent;
    std::vector<int> size;
    std::vector<Frame> history;
};
```

The sentinel frame is a deliberate choice of interface. In this encyclopedia the input command `rollback` undoes the most recent `union` command, even when that union merged nothing. The marker makes the count of commands and the count of frames agree. An implementation whose contract is "rollback undoes the last effective merge" can drop the marker and push only on a real merge.

The offline connectivity algorithm uses the structure inside a traversal of the timeline. Its shape is:

1. Read every event. Give each edge a half-open interval $[l, r)$ of times during which it exists.
2. Build a segment tree over times $1$ through $k+1$. Insert each edge interval into the $O(\log k)$ nodes whose ranges it covers.
3. Traverse the tree from the root. At a node, merge every edge stored there, then recurse into both children.
4. At a leaf, every edge on the root-to-leaf path is alive at that time, so record the component count.
5. After both children return, roll back every merge made at this node.

```cpp
void add_interval(int node, int lo, int hi, int ql, int qr, int edge) {
    if (qr <= lo || hi <= ql) return;
    if (ql <= lo && hi <= qr) {
        tree[node].push_back(edge);
        return;
    }
    int mid = (lo + hi) / 2;
    add_interval(node << 1, lo, mid, ql, qr, edge);
    add_interval((node << 1) | 1, mid, hi, ql, qr, edge);
}

void solve(int node, int lo, int hi) {
    const int checkpoint = dsu.checkpoint();
    for (int edge : tree[node]) dsu.unite(edge_u[edge], edge_v[edge]);
    if (hi - lo == 1) {
        answer[lo] = dsu.components();
    } else {
        int mid = (lo + hi) / 2;
        solve(node << 1, lo, mid);
        solve((node << 1) | 1, mid, hi);
    }
    dsu.rollback_to(checkpoint);
}
```

`checkpoint` and `rollback_to` are conveniences: the checkpoint is the current history length, and `rollback_to` pops until the length is back to that value. The pair makes the undo at a node independent of how many merges the node performed, including the case of zero.

The same pattern answers a batch of independent tests. For each test, record a checkpoint, merge the test's edges, read the answer, and roll back to the checkpoint. The next test starts from the clean state. This is how a query about minimum spanning tree edges and a query about bipartiteness are answered without one test contaminating the next.

## Step-by-step execution

Six elements, ten commands. The history stack is shown after each command, with frames written as $(c \to r, s_0)$.

| Command | parent after | size of roots after | History after | Output |
| --- | --- | --- | --- | --- |
| start | 1 2 3 4 5 6 | 1 1 1 1 1 1 | empty |  |
| union 1 2 | 1 1 3 4 5 6 | 2 1 1 1 1 1 | $(2 \to 1, 1)$ |  |
| union 3 4 | 1 1 3 3 5 6 | 2 1 2 1 1 1 | $(2 \to 1, 1)$, $(4 \to 3, 1)$ |  |
| union 2 4 | 1 1 1 3 5 6 | 4 1 2 1 1 1 | $(2 \to 1, 1)$, $(4 \to 3, 1)$, $(3 \to 1, 2)$ |  |
| same 2 4 | unchanged | unchanged | unchanged | YES |
| rollback | 1 1 3 3 5 6 | 2 1 2 1 1 1 | $(2 \to 1, 1)$, $(4 \to 3, 1)$ |  |
| same 2 3 | unchanged | unchanged | unchanged | NO |
| union 5 6 | 1 1 3 3 5 5 | 2 1 2 1 2 1 | $(2 \to 1, 1)$, $(4 \to 3, 1)$, $(6 \to 5, 1)$ |  |
| same 5 6 | unchanged | unchanged | unchanged | YES |
| rollback | 1 1 3 3 5 6 | 2 1 2 1 1 1 | $(2 \to 1, 1)$, $(4 \to 3, 1)$ |  |
| same 5 6 | unchanged | unchanged | unchanged | NO |

The third union is the one that shows the size rule. The roots are $1$ and $3$, both of size $2$. The implementation attaches the second root under the first, so $p(3) = 1$ and the size of $1$ becomes $4$. The frame stores the old size $2$ of root $1$, not the size of the child.

The fifth command reads the partition after that merge: the representative of $2$ is $1$ and the representative of $4$ is $1$, so the answer is YES. The sixth command pops the frame, which sets $p(3) = 3$ and $s(1) = 2$. The representative of $3$ is now $3$, so the seventh command answers NO.

The last four commands exercise a second component. The union of $5$ and $6$ is pushed on top of the two older frames, and its rollback removes only that merge. The older frames are untouched, which is the stack discipline in action.

## Correctness proof

::: math theorem Theorem
Starting from a state with history $H$, any sequence of merges and rollbacks that never pops more frames than it pushed leaves the parent and size functions in the state that corresponds to the remaining history, and every `same` query reports whether the two elements are in the same set of that state.
:::

::: math proof Proof
The proof is an induction on the number of operations.

The base case is the initial state: every vertex is its own root, every size is one, the history is empty, and a query reports equality exactly when the two vertices are equal.

For a merge of roots $a$ and $b$, the algorithm records the frame required by the definition, changes the parent of the smaller root and the size of the larger root, and leaves every other entry alone. By the invariant, the new parent function is still a forest and the new size is still the number of vertices in the new tree. The history is the old history with one frame appended, which is exactly the definition of the new state.

For a rollback, the top frame belongs to the most recent union command that has not been undone. If it is a merge record, the previous lemma shows that restoring its two entries returns the parent and size functions to the state immediately before that merge. If it is a marker, the command merged nothing, so popping it leaves the arrays untouched, which is again the state before that command. In both cases the history is the old history without its last frame, which is exactly the history of that earlier state.

A find follows parent pointers and stops at a root. By the invariant, every pointer stays inside its set, so the root it stops at is the representative of the set. Two vertices have the same representative exactly when they are in the same set.

The composition of these steps proves the claim for every sequence. The bound on the number of pops ensures that every rollback has a frame to pop, so the history never underflows. $\square$
:::

## Complexity analysis

| Method | Time | Space |
| --- | --- | --- |
| Rebuild for every state | $O(S(n + m\log n))$ | $O(n)$ |
| Snapshot and copy the arrays per undo | $O(n)$ per undo | $O(n)$ |
| Rollback union-find, $q$ operations | $O(q\log n)$ | $O(n+q)$ |
| Offline connectivity with $m$ edge intervals and $T$ leaves | $O(m\log T\log n + T)$ | $O(n + m\log T)$ |

The program bound follows from the depth lemma. Each find walks at most $\lfloor \log_2 n \rfloor$ pointers, so a union costs two finds and one constant-time merge. A rollback is a pop and two assignments, so it is $O(1)$. With $q$ input commands, the total is $O(q\log n)$.

The offline bound has two layers. An interval is stored in $O(\log T)$ segment tree nodes, because an interval decomposes into at most two nodes per level. Each stored copy is merged once during the traversal and rolled back once, so there are $O(m\log T)$ merges. Each merge costs $O(\log n)$ for its two finds, and each rollback costs $O(1)$. The leaves contribute $O(T)$ for reading the answers, and the array of stored edges costs $O(m\log T)$.

The history deserves a separate sentence. Its size is bounded by the number of merges on the current root-to-leaf path plus the frames of the current node, which is at most $m$ in the worst case, but the total number of pushes over the whole traversal is $O(m\log T)$. The stack itself never holds more than the active path, so the live memory is $O(n + m)$, while the stored edge lists are $O(m\log T)$.

At $n = m = k = 10^5$, the logarithm is about $17$. The offline traversal performs on the order of $1.7 \times 10^6$ merges, each with two finds of depth at most $17$, which is tens of millions of pointer steps. That fits comfortably in a contest time limit, while the rebuild baseline performs $10^{10}$ steps or more.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Only merges, online queries | A plain [disjoint set union](/algorithms/graphs/dsu) with path compression |
| Deletions, offline, states nested | A rollback union-find |
| Deletions, online queries | A link-cut tree or another fully dynamic structure |
| Edge lifetimes, answers at every time | A segment tree over time plus a rollback union-find |
| Independent tests of connectivity | A checkpoint, the test, then a rollback |
| The answer is a count of components | A rollback union-find with a component counter |
| The answer is bipartiteness or parity | A rollback union-find with parity to the parent |
| Every historical version must remain queryable | A persistent union-find, not a rollback one |
| The state must be restored to an arbitrary earlier time | A persistent or fully dynamic structure |
| A query depends on the previous answer | Offline processing does not apply |

The second row and the third row are the pair that decides most contest solutions. If the statement can be read offline, the rollback structure is simpler and faster than any dynamic tree. If the statement insists on online answers, no amount of rollback helps, because the future operations are unknown.

The fourth row is the canonical combination. The segment tree supplies the nesting and the rollback structure supplies the undo. Neither is useful without the other in this problem.

## Reference implementations

The manifest publishes one `program` variant in each of the six languages: C, C++17, Java, Python, Pascal and JavaScript. Each program reads the same input and writes the same output, so the six outputs are byte-identical after newline normalization.

The input begins with `n q`. The next `q` lines are commands of three forms:

- `union u v` merges the sets containing $u$ and $v$;
- `rollback` undoes the most recent `union` command;
- `same u v` prints `YES` when $u$ and $v$ are in the same set and `NO` otherwise.

The reference programs use union by size, no path compression, and the command-level rollback convention: a `union` that merges nothing leaves a marker frame, so `rollback` always consumes one command. A rollback with an empty history is a no-op. Nodes are numbered from $1$ to $n$.

The C and C++ programs use fixed arrays and a vector of frames. The Java program uses `BufferedReader` and a `StringBuilder`. The Python program reads the whole input once. The Pascal and JavaScript listings are educational references marked as such at the top of the file; the Pascal version reads one line at a time and parses the command word, so it compiles under pas2js without console-specific input calls.

## Recursion decision

A find is iterative in every language. The tree depth is at most $\lfloor \log_2 n \rfloor$, so recursion would also be safe, but an iterative loop avoids a function call per level and makes the no-compression rule visually obvious.

The segment tree traversal is naturally recursive, and its depth is $\lceil \log_2 T \rceil$, at most about $17$ for the largest timeline. That is harmless in every language. The traversal must roll back after both children return, and a recursive function expresses that order directly. An explicit stack is possible but adds bookkeeping without removing any real depth.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative find, recursive segment tree traversal |
| Java | About $10^4$ frames | Iterative find, recursive traversal |
| Python | The interpreter limit of 1000 | Iterative find, recursive traversal is still safe at $17$ levels |
| Pascal | The operating system stack | Iterative find, recursive traversal |
| JavaScript | About $10^4$ frames | Iterative find, recursive traversal |

The rule is general: **recursion is safe when the depth is logarithmic, and the dangerous recursion is the one that follows the input structure.** A union-find without union by size can form a chain of $n$ nodes, and a recursive find on that chain would overflow the stack before the algorithm produced an answer. Union by size is what makes both the depth and the recursion safe.

## Implementation walkthrough

The first decision is the frame layout. A frame needs the child root, the parent root and the old size of the parent root. Storing the old parent of the child is redundant: without path compression the child is a root, so its parent was itself. Storing both endpoints of the input edge is wrong, because those are not necessarily the roots that were merged.

```cpp
struct Frame { int child, root, old_size; };
```

The second decision is the order inside `unite`. Find both roots first, then check equality, then compare sizes, then record the frame, then change the arrays. If the frame is recorded after the arrays change, the old size is already lost. If the size comparison happens before the find, the comparison is between two non-roots.

The third decision is the checkpoint. A node of the segment tree may perform zero merges, so the rollback routine cannot assume that it has a frame of its own to pop. The checkpoint is the history length before the node's merges, and the exit routine pops until the length returns to that value.

```cpp
const int checkpoint = dsu.checkpoint();
for (int edge : tree[node]) dsu.unite(...);
// recurse or answer
dsu.rollback_to(checkpoint);
```

The fourth decision is the component counter. A successful merge decreases the number of components by one. Its rollback increases the counter by one. A marker frame does neither, because it merged nothing. Keeping the counter in the same frame, or recomputing it as $n$ minus the number of successful merges on the path, are both correct; the first is cheaper.

The fifth decision is input parsing. Commands are words, so the C program reads a token with `%15s` and compares it with `strcmp`. The C++ program reads a `std::string`. The Java program reads a line and splits it. The Pascal program reads a whole line and takes the first word, then parses the two integers from the remainder, one argument per `Read`. The JavaScript and Python programs split the whole input on whitespace.

The sixth decision is output. `same` queries are the only commands that produce output, so the programs append `YES` or `NO` and print once at the end. A flush per query is correct but slower, and it is the first thing to remove when a solution is close to the time limit.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Enabling path compression | A compressed pointer survives a rollback and connects two components that should be separate | Never compress in a rollback union-find |
| Recording the input endpoints instead of the roots | The rollback restores the wrong parent entries | Find both roots first, then record them |
| Restoring the parent but not the size | The next union by size chooses the wrong root, and later depths grow | Store the old size of the root that grew |
| Restoring the size but not the parent | The forest keeps a child edge that should be gone | Restore both entries in the same pop |
| Popping the history in FIFO order | The most recent merge is not the one undone, and the partition is wrong | Use the stack order of the traversal |
| Assuming every union merged something | A redundant union consumes a frame, and the next rollback removes a real merge | Push a marker frame, or define rollback over effective merges only |
| Clearing the arrays instead of popping | All components disappear, and the answers after the rollback are wrong | Undo only the merges of the current node |
| Using rollback for online queries | The answer depends on a future command that has not been read | Use a dynamic structure instead |
| Forgetting to roll back on the leaf path | State leaks into the sibling subtree | Roll back after both children return |
| Recursing in find without union by size | A chain of $n$ nodes overflows the stack | Union by size, and iterate find |

### Why this fails: the compressed pointer that outlives its merge

The plausible wrong approach is to keep path compression and to record only the merge itself. Compression is the standard optimization, after all, and the merge still touches only one root. The bug is that compression touches other nodes later, and those touches are not in the frame.

The smallest counterexample has four elements and three unions. The commands are `union 1 2`, `union 3 4`, `union 2 4`, then `same 1 4`. Before the last union there are two trees, each of size two. The union attaches root $3$ under root $1$, so $p(3) = 1$ and the frame records that change. Now a find on $4$ follows $4 \to 3 \to 1$ and, with compression, sets $p(4) = 1$.

A `rollback` restores $p(3) = 3$ but knows nothing about $p(4)$, which still points at $1$. The next `same 1 4` follows $4 \to 1$ and reports YES. The correct partition after the rollback is $\{1, 2\}$ and $\{3, 4\}$, so the true answer is NO. The compressed pointer crossed the cut that the rollback created.

One union is not enough to expose the bug, because a single merge creates no path to compress. Three unions and one find on a node two levels below the merged root are enough. The bug is silent: every answer before the rollback is correct, and only the states after the undo are wrong.

A second failure in the same area is the redundant union. Suppose the history records only effective merges. The commands `union 1 2`, `union 1 2`, `rollback`, `same 1 2` should leave the first merge in place. If the second union pushes nothing and the rollback pops the first merge, the final answer is NO instead of YES. The command and the frame must agree on what counts as one undoable step.

The lesson is general: **an undo frame must record every cell the operation changed, and path compression changes cells the operation did not intend to change.** Disabling compression is the disciplined way to keep the frame exact.

## Variants and extensions

- **Offline dynamic connectivity.** The standard application: edge intervals, a segment tree over time, a rollback union-find, and a component count. The answer at each leaf is the count after all alive edges are merged.
- **Rollback with divide and conquer over queries.** When each query is a test of a set of edges, a recursive divide and conquer can share the merges that are common to a range of queries, then roll back the rest. The minimum spanning tree query problem and the bipartiteness query problem both use this shape.
- **A parity union-find.** Each vertex stores its color parity to its parent, and an edge whose endpoints already have the same color detects an odd cycle. The parity is restored exactly like the size, so the rollback is still two assignments.
- **A rollback with a component counter.** The counter is one more value saved in each frame, or it is derived from the number of successful merges. It turns the structure into a component-count oracle.
- **A rollback with a custom aggregate.** Any value that is updated only at a root and restored in constant time can join the frame: a hash of the component, a maximum edge weight, or a count of marked vertices.
- **Small-to-large merging instead of rollback.** When the queries can be answered by merging smaller structures into larger ones and the old structure is never needed, small-to-large is the alternative. It avoids the undo but pays for moving elements.
- **A persistent union-find.** When every version must remain queryable, persistence keeps the old arrays instead of undoing changes. It costs $O(\log n)$ space per change and is a different technique.
- **A link-cut tree.** When edges are inserted and deleted online, a dynamic tree maintains connectivity and path aggregates. It is far heavier than a rollback union-find and is the right answer only when the online requirement is real.
- **Rollback on a segment tree of values.** The same undo pattern appears outside time: a traversal over a value domain can merge intervals on the way down and undo them on the way back.

## Contest strategy

1. Decide whether the problem is offline. If the queries can be reordered or the whole input can be read first, the rollback structure is a candidate. If an answer is needed before the next operation is known, it is not.
2. Model each edge or constraint as an interval of validity. The endpoints are the times at which it appears and disappears. An edge that never disappears gets the end of the timeline as its right endpoint.
3. Build the segment tree over the timeline, not over the vertices. Insert each interval into the nodes it covers, which costs $O(\log T)$ copies per interval.
4. Write the rollback union-find with union by size and no compression. Add a checkpoint and a rollback-to-checkpoint pair before writing the traversal, because every node needs them.
5. Put the answer at the leaf, not at the internal node. The path to a leaf is the set of constraints alive at that time.
6. Roll back after both children return, not before the second child. A premature rollback silently answers the sibling with the wrong state.
7. Test the structure against a brute-force rebuild on small random inputs. The rollback bugs are state bugs, and they rarely show up on the sample.

## Worked problems

### Problem 1: components under edge insertions and deletions

**Restatement.** There are $n$ vertices and $m$ initial edges. A sequence of $k$ events either adds an edge between two vertices that do not already have one, or removes an existing edge. After every event, including before the first, report the number of connected components.

**Naive baseline.** Rebuild the graph and run a breadth-first search after every event, which costs $O(k(n+m))$.

**Insight.** Each edge exists during one interval of time. The timeline is a segment tree, and the edges on the root-to-leaf path are exactly the edges alive at that leaf.

**Derivation.** Read all events. For each edge, record the time it appears and the time it disappears; an edge present at the end gets the final time as its right endpoint. Insert every interval into the segment tree. Traverse the tree with a rollback union-find and a component counter. At a leaf, print the counter.

**Correctness.** At a leaf, the path contains every edge whose interval covers that time and no other edge, so the partition is exactly the graph at that time. The counter equals the number of its components.

**Complexity.** $O((m + k)\log k\log n)$ time and $O(n + (m+k)\log k)$ space.

**Common wrong approach.** Treating a removal as a merge, or forgetting that every initial edge has its own interval and may be removed and re-added several times.

### Problem 2: can a set of edges lie in some minimum spanning tree?

**Restatement.** A connected weighted graph has $m$ edges. Each query gives a set of distinct edge indices, and the answer is YES when some minimum spanning tree contains all of them.

**Naive baseline.** For each query, run Kruskal with the query's edges forced first, which costs $O(qm\log n)$.

**Insight.** Kruskal processes weights in increasing order. After all edges of weight below $w$ are contracted, the edges of weight $w$ that belong to one query must form a forest. The test for one weight dirties the union-find, so it needs a rollback.

**Derivation.** Sort all graph edges by weight. Process the queries grouped by the weights they contain. Maintain a global union-find of all edges with weight strictly below the current weight. For each query at this weight, checkpoint the structure, merge the query's edges of this weight one by one, reject the query if any merge is redundant, then roll back to the checkpoint. After all queries of the weight are tested, merge every graph edge of that weight into the global structure and continue.

**Correctness.** The condition is the cycle property of minimum spanning trees: an edge set is extendable to a minimum spanning tree exactly when, for every weight, its edges do not create a cycle after all lighter edges are contracted. The rollback isolates each query's test, so one query cannot affect another.

**Complexity.** $O(m\log n + K\log n)$ time, where $K$ is the total number of edges over all queries, and $O(n + K)$ space for the history.

**Common wrong approach.** Testing all queries at one weight without undoing between them, which merges edges from different queries and reports a cycle that only exists across query boundaries.

### Problem 3: an odd cycle after removing a range of edges

**Restatement.** An undirected graph has $m$ edges numbered in input order. Each query gives a range $[l, r]$ of monitored edges. The answer is YES when the unmonitored edges contain an odd cycle.

**Naive baseline.** For each query, build the graph of unmonitored edges and test bipartiteness with a breadth-first search, which costs $O(q(n+m))$.

**Insight.** A graph contains an odd cycle exactly when it is not bipartite. The unmonitored edges are a prefix and a suffix, and the predicate is monotone as the range moves, so the queries can be answered with a divide and conquer that shares edge insertions and undoes them with a rollback union-find.

**Derivation.** Use a union-find that stores each vertex's parity to its parent. Adding an edge between two vertices in different trees merges them with the appropriate parity; adding an edge inside one tree detects an odd cycle when the parities agree. The predicate "the graph outside $[l, r]$ is non-bipartite" is monotone in $r$ for fixed $l$, because shrinking the suffix only adds edges. Divide and conquer over the queries, insert the edges that are common to the whole range, recurse, and roll back on return.

**Correctness.** The parity union-find maintains a valid two-coloring exactly while no odd cycle has been inserted, so a failed parity check is equivalent to the presence of an odd cycle. The divide and conquer visits every query with exactly the edges outside its range, and the rollback restores the state between branches.

**Complexity.** $O((n + m + q)\log q\log n)$ time and $O(n + m)$ live memory, with the stored edge lists of the recursion.

**Common wrong approach.** Using path compression in the parity union-find. The parity to the parent is compressed along with the pointer, and the rollback then restores neither the pointer nor the parity consistently.

## Practice progression

1. **Recognition.** Given a sequence of merges and undos, decide whether the states are nested. If they are, a stack is enough; if they are not, rollback is the wrong tool.
2. **Direct application.** Implement union by size with no compression, a frame with the child root and the old size, and a checkpoint. Verify the answers against a copy of the parent array on random small inputs.
3. **Adaptation.** Add a component counter and a parity field, and check that both survive a sequence of merges and rollbacks.
4. **Combination.** Build the segment tree over time for offline dynamic connectivity. Compare the leaf answers with a breadth-first search on the same graph.
5. **Challenge.** Solve the minimum spanning tree query problem with a global structure and per-query rollback. Then solve the odd-cycle range problem with a parity union-find and divide and conquer.
6. **Transfer.** Use the same undo pattern inside a parallel binary search or another offline recursion, and observe that the union-find is the only part that changes between the two techniques.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What two array entries does a merge change, and why are there no others? (Key insight)
2. Why is path compression incompatible with rollback? (Key insight)
3. State the depth bound of union by size and prove it. (Formal model)
4. What does a frame store, and why is the old parent of the child not needed? (Implementation walkthrough)
5. What is a checkpoint, and why can a node not simply pop one frame? (Implementation walkthrough)
6. Trace the ten-command example through the rollback of `union 2 4`. (Step-by-step execution)
7. What is the cost of one union, one find and one rollback? (Complexity analysis)
8. How many times is an edge interval stored in the segment tree, and why? (Complexity analysis)
9. What is the smallest instance on which path compression corrupts a rolled-back state, and what does the buggy program report? (Common mistakes)
10. How does a parity union-find detect an odd cycle, and what must the frame restore? (Variants and extensions)

## Further reading

- The union-find that this technique extends is in [the disjoint set union](/algorithms/graphs/dsu).
- The offline recursion that most often hosts the rollback is in [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The segment tree over time is the same structure as [the segment tree](/algorithms/range-queries/segment-tree), with the timeline as its index.
- The minimum spanning tree property that the query problem tests is in [the minimum spanning tree](/algorithms/graphs/mst).
- The bipartiteness test that the parity variant replaces with a union-find is in [the two-coloring test for a bipartite graph](/algorithms/graphs/bipartite-two-coloring).
- The breadth-first search used as the brute-force baseline is in [breadth-first search](/algorithms/graphs/bfs).
- The alternative to undo, which keeps every version of the structure, is in [the persistent segment tree](/algorithms/range-queries/persistent-segment-tree).
- The merging strategy that avoids undo when old states are never needed is in [small-to-large merging](/algorithms/trees/small-to-large-merging).
- The equivalence relation that a union-find maintains is the discrete mathematics of partitions, in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The same offline principle applied to a geometric structure is in [the convex hull](/algorithms/geometry/convex-hull).
