---
id: start.data-structures
title: Data structures and modeling
summary: The vocabulary every solution is written in, and how to choose a representation from the constraints rather than from habit.
division: []
subjects: [arrays, graphs, trees, searching]
level: introductory
importance: core-prerequisite
keywords: [stack, queue, hash table, heap, tree, graph, adjacency, components]
prerequisites:
    required: [start.computational-foundations]
    recommended: [start.from-ap-csa, graphs.representation, searching.binary-search]
reviewed: false
draft: false
---

Part 4 is the vocabulary. Almost every competitive programming problem is solved by choosing a data structure and then applying a technique to it, and the choice of structure constrains the technique as much as the other way round.

The ten modules below go from the simplest structures to the richest. The first four cover the linear and tree-shaped structures that every problem uses. The next four cover graphs, which is where most of the difficulty lives. The last two are about seeing a problem as a graph, and about choosing the right representation once you have.

<Synonyms terms="data structures, containers, abstract data types, collections, graph theory basics" />

## 4.1 Stacks and queues

A **stack** is a last-in, first-out container. It supports `push`, `pop`, and `top`, each in $O(1)$ time. A **queue** is first-in, first-out, with `enqueue`, `dequeue`, and `front`, each in $O(1)$. A **deque** supports insertion and removal at both ends.

The abstract operations are simple; the implementation is where the contest problems hide. The standard implementation is a **circular buffer**: an array with a head index and a tail index that wrap around rather than growing without bound. This matters for two reasons. It uses $O(1)$ amortised time per operation instead of $O(n)$ for a Python list with `pop(0)`, and it uses a fixed amount of memory, which matters when the queue can hold $10^7$ elements.

**Why it matters.** Stacks and queues are not "easy data structures". They are the two shapes that turn a problem into an algorithm. A depth-first search is a stack. A breadth-first search is a queue. The choice between them is the difference between exploring a graph deeply and exploring it in rings, and that choice is a statement about the problem.

Two applications are worth learning as patterns:

**The monotone stack.** Given an array, find for each element the first larger element to its right. Push elements onto a stack; when the current element is larger than the stack's top, that top is popped and its answer is recorded. Each element is pushed and popped once, so the cost is $O(n)$ for the whole array, not $O(n^2)$.

**Bracket matching.** Scan the string, pushing opening brackets. On a closing bracket, the top of the stack must be the matching opening bracket, or the string is malformed. At the end the stack must be empty.

**Worked example.** Consider the "next greater element" problem: for each position $i$, find the smallest $j > i$ with $a_j > a_i$, or $-1$ if there is none.

```cpp
std::vector<int> nextGreater(const std::vector<int>& a) {
    std::vector<int> answer(a.size(), -1);
    std::vector<int> st;                 // indices, values decreasing
    for (int i = 0; i < static_cast<int>(a.size()); ++i) {
        while (!st.empty() && a[st.back()] < a[i]) {
            answer[st.back()] = a[i];
            st.pop_back();
        }
        st.push_back(i);
    }
    return answer;
}
```

The stack holds indices whose values are in decreasing order from bottom to top. When $a_i$ exceeds the top, that element's answer is $a_i$: it is the first larger element to the right, because everything between the top index and $i$ was smaller and has already been popped.

**What you must get right.** Know which end you pop from, and know that in a FIFO queue "pop" means _remove the front_. The most common bug in a breadth-first search is using a stack and calling it a queue, which produces a depth-first traversal and entirely wrong distances.

### Checkpoint

**Conceptual.**

1. State the operations each of a stack, a queue and a deque supports, and their costs.
2. Explain what a circular buffer is and give the two reasons it beats a Python list for queue workloads.
3. Describe the monotone stack technique and explain why each element is pushed and popped exactly once.

**Code reading.**

1. This function is claimed to compute the shortest distance to every cell. Say what traversal it actually performs, and rewrite it:

    ```python
    stack = [(0, 0)]
    while stack:
        r, c = stack.pop()
        for dr, dc in dirs:
            stack.append((r + dr, c + dc))
    ```

2. This code finds the next greater element. Say what is wrong with the condition, and what it computes instead:

    ```cpp
    while (!st.empty() && a[st.back()] > a[i]) { answer[st.back()] = a[i]; st.pop_back(); }
    ```

**Implementation.** Implement a generic queue and a generic stack on top of a single array with head and tail indices that wrap around. Verify that they behave correctly across a thousand interleaved push, pop and peek operations, including the cases where the buffer is empty and where it is full.

**Applied problem.** A problem gives a string of brackets, some of which are `{`, `}`, `[`, `]`, `(`, `)`. Write a function that returns the position of the first mismatched bracket, or $-1$ if the string is balanced. Give the time complexity and say which structure you used and why.

## 4.2 Sets, maps and hash tables

A **set** stores distinct elements with membership testing. A **map** (or dictionary, or association list) stores key-value pairs with lookup by key. Both come in two flavours, and the difference matters.

**Hash-based** structures give $O(1)$ expected membership and lookup, with $O(n)$ worst case when every key collides. **Ordered** structures, usually balanced binary search trees, give $O(\log n)$ guaranteed lookup and additionally give you sorted iteration and the ability to ask for the successor of a key.

::: math definition Hash table
A hash table stores keys in an array of buckets. A hash function maps a key to a bucket index, and each bucket holds the keys that map to it, either as a linked list (chaining) or in a probe sequence that searches for a free slot (open addressing). The **load factor** is the ratio of the number of stored keys to the number of buckets.
:::

The load factor drives everything. Chaining tolerates a load factor above one; open addressing needs the table to stay below one, typically around $0.7$, and resizes when it exceeds the threshold. A table that is resized halves the effective capacity temporarily, so the amortised cost of an insertion stays $O(1)$.

**Why it matters.** A hash table is the right answer to "have I seen this before?", which is a question that appears in almost every problem. It is also the answer to the wrong question when the constraints include adversarial input.

**The adversarial problem.** Contest problems are designed by people who know that hash tables exist. If your hash function is `hash(x) = x % table_size` and the table size is a power of two, an adversary can construct $n$ keys that all land in the same bucket, and your $O(1)$ lookup becomes $O(n)$. The defense is a randomised hash: mix the key with a random seed before reducing modulo the table size. C++'s `std::hash` for integers is the identity, so `unordered_map<int, int>` is genuinely vulnerable, and this is a real failure mode in contests rather than a theoretical worry.

The standard defense is the **splitmix64** mixer, which applies a multiplicative scramble and a bit-mixing step before the modulo. It is three lines long and it removes the attack.

**Worked example.** Counting occurrences of integers with values up to $10^6$ has two good implementations. A counting array of size $10^6$ gives $O(1)$ per update and no collision risk at all, using 4 MB. A hash map gives $O(1)$ expected per update with no memory tied to the value range, but with a small constant-factor penalty and a theoretical worst case. When the value range is bounded and known, the array is almost always the better choice.

**What you must get right.** Know the worst case of a hash table, and know that "expected $O(1)$" is a statement about a distribution, not a guarantee. When the input can be adversarial, either use a randomised hash or use an ordered map and accept the logarithmic cost.

### Checkpoint

**Conceptual.**

1. Give the expected and worst-case cost of a lookup in a hash table and in an ordered map, and say what each costs that the other does not.
2. Explain the role of the load factor, and why open addressing and chaining tolerate different load factors.
3. Describe the adversarial-input attack against `hash(x) = x % table_size`, and name the defense.

**Code reading.**

1. This code counts occurrences. Say what its expected and worst-case costs are, and what the worst case looks like:

    ```cpp
    std::unordered_map<int, int> counts;
    for (int x : a) counts[x]++;
    ```

2. This code is a correct solution but a slow one. Explain why the lookup is slower than an array access, and rewrite it for values bounded by $10^6$:

    ```cpp
    std::map<int, int> counts;
    for (int x : a) counts[x]++;
    ```

**Implementation.** Write a hash table with chaining that resizes when the load factor exceeds one, and verify that a sequence of insertions and lookups behaves correctly across a resize. Then implement the splitmix64 mixer and check that it distributes a run of consecutive integers across buckets more evenly than the identity function.

**Applied problem.** A problem gives $n \le 10^6$ integers in the range $[0, 10^9]$ and asks how many distinct values there are. Give two implementations with their time and space complexities, and say which one you would submit and why.

## 4.3 Heaps and priority queues

A **priority queue** is a container that always lets you remove the element with the highest (or lowest) priority. The standard implementation is a **binary heap**: a complete binary tree stored in an array, where the children of index $i$ live at $2i+1$ and $2i+2$, and the heap property says every parent is at least as large as its children (for a max-heap).

The operations:

| Operation               | Cost        | Mechanism                                              |
| ----------------------- | ----------- | ------------------------------------------------------ |
| Find the maximum        | $O(1)$      | read the root                                          |
| Insert                  | $O(\log n)$ | append, then sift up                                   |
| Remove the maximum      | $O(\log n)$ | replace the root with the last element, then sift down |
| Build from $n$ elements | $O(n)$      | sift down from the last internal node                  |
| Change a key            | $O(\log n)$ | sift in the appropriate direction                      |

::: math invariant Heap invariant
A binary heap stored in an array satisfies the heap property when, for every index $i$ with $2i + 1 < n$, the value at $i$ is at least the values at $2i + 1$ and $2i + 2$. The invariant is established by the sift-down operation, and it guarantees that the root is the maximum.
:::

The $O(n)$ build is the surprise most people meet: heapifying an existing array bottom-up costs $O(n)$, not $O(n \log n)$, because most nodes are near the leaves and sift down only a short distance. The sum is $\sum_{h} \frac{n}{2^h} h = O(n)$.

**Why it matters.** The priority queue is what turns the greedy technique into an algorithm. Whenever a problem says "repeatedly take the smallest remaining item", the priority queue is the structure that implements it. Dijkstra's algorithm, Prim's algorithm, best-first search, and merging $k$ sorted lists are all the same code with different comparison functions.

The **indexed** priority queue is the other form you need. It stores a handle for each element alongside its key, so you can find and change an element's priority in $O(\log n)$. Dijkstra's algorithm with a lazy deletion uses a plain priority queue of pairs; Dijkstra's algorithm with decrease-key uses an indexed one, and the indexed version does strictly less work.

**Worked example.** Merging $k$ sorted lists of total length $n$ with a priority queue costs $O(n \log k)$: $n$ extractions, each costing $O(\log k)$. Doing it by repeated pairwise merging costs $O(n \log k)$ too, but with a much worse constant, because each pass copies the whole data.

**What you must get right.** A priority queue gives you the minimum or maximum, not arbitrary access and not sorted iteration. If your algorithm needs the three smallest remaining items _together_, or needs to remove an arbitrary element, a priority queue is the wrong structure.

### Checkpoint

**Conceptual.**

1. State the heap property, the array layout, and the cost of each of insert, extract-min, find-min, build and decrease-key.
2. Explain why building a heap bottom-up costs $O(n)$ and not $O(n \log n)$.
3. Explain the difference between a priority queue of pairs and an indexed priority queue, and give one algorithm that needs each.

**Code reading.**

1. This code builds a heap. Say what its complexity is, and rewrite it to build in $O(n)$:

    ```cpp
    for (int i = 0; i < n; i++) { heap.push_back(a[i]); siftUp(heap, i); }
    ```

2. This loop is a Dijkstra implementation using a lazy priority queue. Say how many entries can be in the queue at once, and what the difference would be with an indexed queue:

    ```cpp
    while (!pq.empty()) { auto [d, u] = pq.top(); pq.pop(); for (auto [v, w] : adj[u]) { ... pq.push({d + w, v}); } }
    ```

**Implementation.** Implement a binary min-heap on a plain array with `push`, `top` and `pop`, and verify against a sorted reference implementation over ten thousand random operation sequences. Then implement a heapify function and check that it produces the same heap as inserting the elements one at a time.

**Applied problem.** A problem gives $k$ sorted lists whose total length is $n$ and asks for the merged list. Give the algorithm, its time complexity, and the data structure you use. Then say how the complexity changes if $k$ is $10^5$ and each list has one element.

## 4.4 Trees and binary trees

A **tree** is a connected acyclic graph. It has a distinguished **root**, every other node has exactly one **parent**, and a node's **depth** is its distance from the root. A node with no children is a **leaf**, and the **height** of a tree is the length of the longest root-to-leaf path. The **subtree** rooted at a node is the node together with all its descendants.

A **binary tree** has at most two children per node, and the two are distinguished as left and right. The most important class of binary trees is the **binary search tree**, where every node's key is larger than all keys in its left subtree and smaller than all keys in its right subtree.

The cost of every operation on a search tree is proportional to its height, $h$. That single sentence is the whole story:

| Tree                     | Height                       | Search               |
| ------------------------ | ---------------------------- | -------------------- |
| Balanced search tree     | $h = \lceil \log_2 n \rceil$ | $O(\log n)$          |
| Sorted-array search tree | $h = n$                      | $O(n)$               |
| Random insertion order   | $h = O(\log n)$ expected     | $O(\log n)$ expected |

::: math counterexample A search tree can be a list
Insert the keys $1, 2, 3, \dots, n$ into a binary search tree in that order. Every insertion goes to the right of the last node, so the tree becomes a path of height $n$. Searching it takes $O(n)$ time, which is no better than scanning an array, and the insertion order was a perfectly legal sequence of operations.
:::

This is why the _balanced_ in balanced search tree matters. AVL trees keep the heights of the two subtrees within one of each other, and red-black trees keep the longest root-to-leaf path at most twice the shortest. Both guarantee $h = O(\log n)$.

**Traversals.** A binary tree admits several standard traversals, and choosing the right one tells you what the traversal computes:

| Traversal   | Order             | Natural use                           |
| ----------- | ----------------- | ------------------------------------- |
| Preorder    | node, left, right | copying a tree, expression prefix     |
| Inorder     | left, node, right | sorted order, for a search tree       |
| Postorder   | left, right, node | freeing a tree, bottom-up computation |
| Level order | by depth          | shortest paths, breadth-first         |

**Worked example.** A tree is given as a parent array, where `parent[i]` is the parent of node $i$ and `-1` marks the root. The inorder traversal can be computed without recursion by pushing the left spine onto a stack and popping it as you go, which is the standard iterative form of an inorder traversal and the same technique used for the next-greater-element problem in module 4.1.

**What you must get right.** Recursion depth on a tree equals the tree's height, so a path-shaped tree of $10^5$ nodes overflows a stack in Java and in CPython. Know whether your tree is balanced before you recurse.

### Checkpoint

**Conceptual.**

1. Define depth, height, leaf and subtree, and state the cost of a search in a search tree in terms of the tree's height.
2. Explain what a balanced search tree guarantees, and give the insertion order that turns a search tree into a path.
3. State what each of the four standard traversals computes and give a natural use for each.

**Code reading.**

1. This recursion visits every node of a tree. Say what its depth is on a tree of $10^5$ nodes arranged as a path, and say what happens in Java:

    ```java
    void visit(Node n) { if (n == null) return; visit(n.left); visit(n.right); }
    ```

2. This code produces the preorder sequence of a tree. Say which traversal produces the sorted order of a search tree, and why the other one does not.

**Implementation.** Write an iterative inorder traversal of a binary search tree that uses an explicit stack, and check that it produces sorted output on a search tree built from a random permutation of $1, \dots, 1000$.

**Applied problem.** A problem gives $n$ nodes and a parent array, and asks for the depth of every node. Describe a solution that works in $O(n)$ time without recursion, and say why the recursive version is risky.

## 4.5 Graphs, vertices, edges and paths

A **graph** is a pair $(V, E)$ where $V$ is a set of **vertices** and $E$ is a set of **edges**, each edge joining two vertices. A graph is **simple** if it has no self-loops and no parallel edges. The **degree** of a vertex is the number of edges incident to it; the sum of degrees is $2|E|$. A **walk** is a sequence of vertices and edges; a **path** is a walk with no repeated vertices; a **cycle** is a closed path of length at least three in a simple graph. A **cycle** is a closed walk with no repeated vertices other than the first and last.

A graph is **connected** if every pair of vertices is joined by a path. It is **complete** if every pair of distinct vertices is joined by an edge.

**Why it matters.** A huge fraction of contest problems are graph problems in disguise. "A maze with rooms and doors" is a graph. "A road network with distances" is a weighted graph. "A dependency ordering" is a directed graph. "Which animals eat which" is a directed graph. Learning to see the graph is most of the work.

**The algorithmic spectrum.** Once a problem is a graph, the question becomes which traversal or which algorithm applies:

| Question                                      | Technique                                  |
| --------------------------------------------- | ------------------------------------------ |
| Is everything reachable from a source?        | BFS or DFS                                 |
| Shortest path, all edges weight 1             | BFS                                        |
| Shortest path, nonnegative weights            | Dijkstra                                   |
| Shortest path, possibly negative weights      | Bellman-Ford                               |
| Shortest path, weights only 0 and 1           | 0-1 BFS                                    |
| Ordering with prerequisite constraints        | Topological sort                           |
| Minimum total edge weight spanning everything | Minimum spanning tree                      |
| Connectivity and grouping                     | Disjoint set union                         |
| Longest or heaviest path in a DAG             | Dynamic programming on a topological order |

**Worked example.** A problem describes $n$ fields and $m$ one-way roads, and asks which fields can be reached from a given starting field. This is a reachability question in a directed graph, and the answer is the set of vertices visited by a single traversal from the start. The trap is forgetting that the graph may have cycles, so the traversal needs a visited set rather than a recursion that assumes acyclicity.

**What you must get right.** Know the difference between the traversal that finds reachability and the traversal that finds shortest paths. A depth-first search computes _a_ path, not the shortest one, and using it where distances are needed is the single most common graph mistake.

### Checkpoint

**Conceptual.**

1. Define vertex, edge, degree, walk, path and cycle, and state the relation between the sum of degrees and the number of edges.
2. Match six question types to their standard techniques, from reachability to minimum spanning tree.
3. Explain why a depth-first search cannot be used to find shortest paths in a weighted graph.

**Code reading.**

1. This code claims to compute shortest distances. Say what it actually computes and give one small input where the answers differ:

    ```cpp
    std::vector<int> dist(n, -1);
    std::stack<int> st; st.push(0); dist[0] = 0;
    while (!st.empty()) { int u = st.top(); st.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; st.push(v); } }
    ```

2. This code solves a shortest-path problem on a graph whose edge weights are given as the second element of each pair. Say what algorithm it implements and under what condition it is correct.

**Implementation.** Write a function that takes an undirected graph as an adjacency list and returns the number of vertices in the largest connected component. Check it on a graph with two components of sizes three and five, and on a graph with no edges at all.

**Applied problem.** A problem describes $n$ rooms, $m$ doors that connect them, and asks which rooms can be reached from room 1 without passing through a locked door. Describe the model, the traversal, and the complexity.

## 4.6 Adjacency lists and adjacency matrices

There are two standard ways to store a graph in memory.

**Adjacency list.** For each vertex, store the list of its neighbors. The memory is $O(V + E)$: one container per vertex plus one entry per directed edge, or two per undirected edge. Traversing the neighbors of a vertex costs $O(\deg(v))$, and a full traversal costs $O(V + E)$.

**Adjacency matrix.** Store a table of $V \times V$ booleans or values. The memory is $O(V^2)$, and testing whether an edge exists costs $O(1)$.

::: math definition Adjacency representations
An adjacency list stores, for every vertex $v$, the set of its neighbors. An adjacency matrix stores a table $M$ where $M[u][v]$ is the weight of the edge from $u$ to $v$, or a sentinel when there is no edge.
:::

The choice is forced by the density of the graph.

| Property            | Adjacency list | Adjacency matrix |
| ------------------- | -------------- | ---------------- |
| Memory              | $O(V + E)$     | $O(V^2)$         |
| Edge existence test | $O(\deg(u))$   | $O(1)$           |
| Neighbor iteration  | $O(\deg(u))$   | $O(V)$           |
| Works for           | sparse graphs  | dense graphs     |

A graph is sparse when $E = O(V)$ and dense when $E = O(V^2)$. With $V = 10^5$, an adjacency matrix needs $10^{10}$ entries, which does not fit in any contest memory limit, so every large contest graph uses adjacency lists.

There is a third representation, the **edge list**: a flat array of $2E$ endpoints. It is compact and it is the natural input format for Kruskal's algorithm and for sorting edges. The **compressed sparse row** form is the flat version of an adjacency list: one array of offsets and one flat array of destinations, which removes a pointer chase per neighbor and is measurably faster.

**Worked example.** A contest problem gives $n = 10^5$ vertices and $m = 3 \times 10^5$ edges. An adjacency matrix of `bool` needs $10^{10}$ bytes. An adjacency list of `vector<int>` needs $10^5$ vector headers of 24 bytes each, 2.4 MB, plus $6 \times 10^5$ integers at 4 bytes, 2.4 MB, plus allocator overhead: about 6 MB in total. A compressed sparse row representation needs the same 2.4 MB of destinations plus $10^5$ offsets, with no per-vertex allocation: about 2.8 MB and no pointer chasing.

**What you must get right.** Compare $V^2$ against the memory limit before you choose a matrix. And remember that an undirected edge is stored twice, which doubles both the memory and the traversal cost relative to the edge count.

### Checkpoint

**Conceptual.**

1. Give the memory, the edge-existence cost and the neighbor-iteration cost of an adjacency list and an adjacency matrix.
2. Define sparse and dense, and say which representation each demands.
3. Describe the compressed sparse row representation and give its two advantages over a vector of vectors.

**Code reading.**

1. This code builds an adjacency list for an undirected graph and then reports the degree of every vertex. Say what it reports, and what it should report:

    ```cpp
    for (auto [u, v] : edges) { adj[u].push_back(v); }
    ```

2. This code allocates an adjacency matrix for a graph with $10^5$ vertices. Compute its memory and say what happens.

**Implementation.** Write a function that converts an adjacency list into the compressed sparse row form, and verify that a breadth-first search over the converted form produces exactly the same distances as one over the original.

**Applied problem.** A problem gives $n = 5000$ vertices and asks you to answer $10^6$ questions of the form "is there an edge between $u$ and $v$?". Compare an adjacency matrix with an adjacency list for this problem, giving the memory of each and the cost of each query.

## 4.7 Directed versus undirected graphs

In an **undirected** graph an edge $\{u, v\}$ can be traversed in either direction. In a **directed** graph an edge $(u, v)$ goes only from $u$ to $v$.

The differences run deeper than storage:

- A path in an undirected graph can be walked in either direction. In a directed graph you must respect the arrow, and "can $u$ reach $v$" is not the same question as "can $v$ reach $u$".
- Undirected graphs have cycles detected by a depth-first search that finds an edge back to an ancestor. Directed graphs need a different method, because an edge to a vertex already visited is not necessarily a cycle.
- Topological order exists only for directed acyclic graphs.
- A directed graph has in-degree and out-degree; an undirected graph has only degree.
- Strongly connected components are the directed analogue of connected components.

**Why it matters.** Reading "roads connect towns" and "you may travel only in the listed direction" changes the algorithm. A shortest-path problem on a directed graph with nonnegative weights still uses Dijkstra's algorithm; the same problem on an undirected graph with negative weights has no solution at all, because a path can be traversed back and forth to accumulate negative weight indefinitely. That is the reason Dijkstra's algorithm requires nonnegative weights and why Bellman-Ford exists.

**Worked example.** Consider a graph of dependencies: project $A$ must finish before $B$ starts. The edges point from prerequisite to dependent, and the problem asks for an order in which to do the projects. That order is a topological sort, which exists exactly when the dependency graph has no cycle. If the dependencies contain a cycle, no valid order exists, and the correct output is to report the cycle.

**What you must get right.** Store every undirected edge twice and every directed edge once. This is the most common source of "my traversal only visits half the graph" bugs, and it is invisible in a small hand-drawn example.

### Checkpoint

**Conceptual.**

1. List five differences between a directed and an undirected graph, and say which traversal technique applies to each.
2. Explain why Dijkstra's algorithm requires nonnegative edge weights, and what happens without the requirement in an undirected graph.
3. State what a topological order is and the exact condition under which it exists.

**Code reading.**

1. This code stores an undirected graph. Say what it computes, and give the smallest input on which the result is wrong:

    ```cpp
    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
    ```

2. This code computes a topological order by repeatedly removing a vertex with in-degree zero. Say what it returns when the graph contains a cycle, and how the code should detect that case.

**Implementation.** Write a function that checks whether a directed graph contains a cycle, using Kahn's algorithm. Test it on a directed acyclic graph, on a graph with a single self-loop, and on a graph with a two-vertex cycle.

**Applied problem.** A problem gives $n$ tasks and $m$ precedence constraints "task $u$ must be done before task $v$". Describe the graph you build, the algorithm you run, and what you print when no valid order exists.

## 4.8 Connected components and cycles

A **connected component** is a maximal set of mutually reachable vertices. In an undirected graph, components can be found with a depth-first search or a breadth-first search, starting a new traversal from every vertex not yet visited. The cost is $O(V + E)$, and the component count is one more than the number of successful traversals.

The alternative is **disjoint set union**, which processes edges in any order and merges the sets of their endpoints. It is not a traversal, so it cannot answer questions that depend on the shape of the graph, but it is extremely fast when the only question is "which vertices are connected".

**Cycle detection** in an undirected graph uses depth-first search with parent tracking. When you encounter a visited neighbor that is not the parent of the current vertex, you have found a cycle. The parent exclusion is essential: without it, every edge back to your parent looks like a cycle, and the answer is always "yes".

::: math theorem Cycle count in a forest
In an undirected graph with $V$ vertices, $E$ edges and $C$ connected components, the graph is acyclic if and only if $E = V - C$. Each component of an acyclic graph is a tree, and a tree on $v$ vertices has $v - 1$ edges, so an acyclic graph has $V - C$ edges in total.
:::

For **directed** graphs, cycle detection has a clean characterisation: a directed graph is acyclic exactly when a topological sort succeeds. The depth-first-search method, which colors vertices white, gray and black and reports a cycle when it finds a gray neighbor, is an alternative.

**Why it matters.** "How many groups are there?" and "can these tasks be ordered?" are both connectivity questions, and they appear constantly in problems that never mention graphs.

**Worked example.** A problem gives $n$ cities and $m$ two-way roads and asks for the number of connected groups of cities. A depth-first search from every unvisited city answers it in $O(V + E)$. If instead the question were "what is the largest number of cities in one group?", the same traversal works, but you must track the size of each component, and you must be careful that the visited array is not reused across components.

**What you must get right.** Reset or preserve the visited markers between components, and exclude the parent when detecting cycles in an undirected graph. Both mistakes produce plausible-looking wrong answers rather than crashes.

### Checkpoint

**Conceptual.**

1. Define a connected component, and give the time complexity of finding all of them with a traversal and with disjoint set union.
2. State the theorem relating $V$, $E$ and $C$ in an acyclic undirected graph, and explain why it holds.
3. Explain the parent-exclusion rule in undirected cycle detection, and say what goes wrong without it.

**Code reading.**

1. This code counts connected components. Say what it returns on a graph with two components, and explain the parent check:

    ```cpp
    for (int v : adj[u]) {
        if (v == parent) continue;
        if (visited[v]) { has_cycle = true; continue; }
        visited[v] = true; dfs(v, u);
    }
    ```

2. This code detects a cycle but reports one on every graph. Say why, and give the fix:

    ```cpp
    bool has_cycle(int u, int p) {
        visited[u] = true;
        for (int v : adj[u]) {
            if (!visited[v] && has_cycle(v, u)) return true;
            else if (visited[v] && v != p) return true;
        }
        return false;
    }
    ```

**Implementation.** Write a function that counts the connected components of an undirected graph and returns the size of each. Test it on a disconnected graph, on a graph with one isolated vertex, and on an empty graph, and report what you get for each.

**Applied problem.** A problem gives $n$ islands and $m$ bridges and asks for the largest number of islands reachable from a given island. Describe the traversal, the data you keep while running it, and the complexity.

## 4.9 Grid problems as implicit graphs

A grid is a graph you are never given explicitly. Each cell is a vertex, and the cells sharing a side are adjacent. The grid with $R$ rows and $C$ columns has $RC$ vertices and at most $4RC$ edges.

**The implicit representation.** You never build the neighbor lists. You compute the four neighbors on demand using a direction array:

```cpp
const int dr[4] = {-1, 1, 0, 0};
const int dc[4] = {0, 0, -1, 1};
```

For each cell $(r, c)$, the neighbors are $(r + dr[k], c + dc[k])$ for $k = 0, 1, 2, 3$, subject to bounds checking. The traversal cost is $O(RC)$ because each cell is visited once and generates four candidate neighbors.

The benefit is memory. Storing the visited set needs $RC$ bytes with a byte array, or $RC$ bits with a bitset. For $R = C = 1000$ that is 1 MB or 125 KB, against the 4 MB an `int` distance array would need.

**Why it matters.** Grid problems are among the most common contest problems and among the easiest to mis-model. The modeling questions are: what is a vertex, what is an edge, is the graph directed, is it weighted, and does the movement cost the same in every direction?

**Worked example.** Consider "shortest path on a grid from the top-left cell to the bottom-right cell, moving only right or down". Here the implicit graph is directed, each edge has weight 1, and the shortest path has length $R + C - 2$. A breadth-first search finds it in $O(RC)$, but the dynamic programming solution visits each cell once, in row order, and is also $O(RC)$ with a smaller constant and no queue.

The same grid with the additional constraint that you may not step on certain cells changes the answer to $-1$ when the path is blocked, and the breadth-first search handles that naturally by never reaching the target.

**What you must get right.** Bounds-check every neighbor before enqueueing it, and mark a cell visited _when you enqueue it_, not when you dequeue it. Marking on dequeue lets the same cell be enqueued many times, which turns an $O(RC)$ traversal into an exponential blow-up on open grids.

### Checkpoint

**Conceptual.**

1. State the number of vertices and edges of an $R \times C$ grid, and explain why the neighbor lists are never stored.
2. Explain the difference between marking a cell visited on enqueue and on dequeue, and give the complexity of each.
3. Give the memory of the visited set for a $1000 \times 1000$ grid as a byte array and as a bitset.

**Code reading.**

1. This traversal is correct on a tree but explodes on an open grid. Say what is wrong, and give the fix:

    ```python
    while q:
        r, c = q.popleft()
        for dr, dc in dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    ```

2. This code computes the shortest path on a grid where you may move only right or down. Say which algorithm it is, what its complexity is, and why it is not needed.

**Implementation.** Write a breadth-first search on a grid with blocked cells that returns the shortest distance from the top-left cell to the bottom-right cell, and the number of cells visited before it terminates. Test it on a grid with a single wall and on a grid where the target is completely walled off.

**Applied problem.** A problem gives an $R \times C$ grid of characters and asks for the largest area of a rectangle of `X` cells. Describe how you would model this as a graph or as a sweep over rows and columns, and give the complexity of your approach.

## 4.10 Choosing a representation from the constraints

The final module is the one that turns everything else into a decision. When you meet a new problem, the questions are always these four, in this order.

**What are the entities?** Identify the vertices. In a grid they are cells; in a scheduling problem they are tasks; in a flow problem they are both the tasks and the resources. Getting this wrong makes everything downstream wrong.

**What are the relationships?** Identify the edges. Are they symmetric? Do they have weights? Are they given explicitly or implied by a rule?

**What are the sizes?** $V$, $E$, and the value ranges. These decide whether an adjacency matrix is even possible and whether a $2^n$ table is affordable.

**What will be asked?** This is the question that actually selects the algorithm. Reachability, shortest paths, connectivity, ordering, minimum weight, or a count of something. Each question has its own technique, and the technique dictates the representation.

Some worked combinations:

| Situation                                      | Representation   | Technique            |
| ---------------------------------------------- | ---------------- | -------------------- |
| $V \le 2000$, $E$ dense, many edge tests       | adjacency matrix | Floyd-Warshall       |
| $V = 10^5$, $E = 10^5$, shortest paths         | adjacency list   | Dijkstra with a heap |
| Only connectivity is asked, edges in any order | edge list        | Disjoint set union   |
| Ordering with prerequisites                    | adjacency list   | topological sort     |
| $V = 10^6$ cells, four neighbors               | implicit         | breadth-first search |

The last row is worth emphasising. A grid with a million cells has two million edges, and materialising them as an adjacency list would cost 16 MB of destinations and a million allocations, for a graph whose structure you already know. The implicit representation is both smaller and faster, and it is available precisely because the adjacency rule is uniform.

**What you must get right.** Decide the representation _after_ deciding what is being asked, and sanity-check the memory against the limit before you commit. A solution that is asymptotically beautiful and uses an adjacency matrix for $10^5$ vertices is a solution that scores zero.

### Checkpoint

**Conceptual.**

1. State the four questions you ask when choosing a representation, in order, and say which one actually selects the algorithm.
2. Given a graph with $10^5$ vertices and $3 \times 10^5$ edges, say which representation is possible and give its memory.
3. Explain what makes an implicit representation possible, and give a case where it is better than materialising the edges.

**Code reading.**

1. A solution uses an adjacency matrix for a graph with $4 \times 10^4$ vertices. Compute the memory of the matrix and say what the limit on $V$ is for a 256 MB budget with 8-byte entries.

2. This solution stores an adjacency list for a grid of $10^6$ cells. Say what it could have done instead, and what it saves.

**Implementation.** Write a small routine that, given the number of vertices, the number of edges and the type of question being asked, prints the representation and the technique you would use. Apply it to five scenarios you invent, and check that each answer is consistent with the size rules in this module.

**Applied problem.** A problem gives $n$ up to $2 \times 10^5$ weighted roads and asks for the shortest route between two cities, allowing repeated roads. Give the representation, the algorithm, and the time complexity, and say what would change if negative weights were possible.

## Review checklist

You are ready for part 5 when you can answer the following without consulting the text.

- State the operations and costs of a stack, a queue and a deque, and say which one a breadth-first search requires.
- Explain how the monotone stack finds the next greater element in $O(n)$, and why each element is pushed and popped exactly once.
- Give the expected and worst-case cost of a hash table lookup, and describe an adversarial input that defeats a naive hash function.
- State the costs of the heap operations, and explain why building a heap from an array costs $O(n)$ rather than $O(n \log n)$.
- Explain why the height of a search tree matters, and give an insertion order that turns a search tree into a list.
- Compute the memory of an adjacency list and an adjacency matrix for a graph with $10^5$ vertices and $3 \times 10^5$ edges, and say which one you would use.
- Explain why an undirected edge is stored twice and what breaks if you store it once.
- Describe the parent-exclusion rule in undirected cycle detection, and say what happens without it.
- Describe how a grid becomes an implicit graph, and give the memory of the visited set for a $1000 \times 1000$ grid.
- Lay out the four questions you ask when choosing a representation, and apply them to a problem with $10^5$ cities and $4 \times 10^5$ roads.

Next: [Programming language transition](/start/from-ap-csa/part-5-language-transition).
