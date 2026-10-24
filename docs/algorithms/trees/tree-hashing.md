---
id: trees.tree-hashing
title: Tree hashing
summary: Hash every subtree bottom-up from the sorted hashes of its children, so two rooted trees can be compared in near-linear time regardless of their labels.
division: [gold, platinum]
subjects: [trees]
level: intermediate
importance: common-contest-technique
keywords: [tree hashing, rooted tree isomorphism, subtree hash, canonical form, Aho-Hopcroft-Ullman]
prerequisites:
    required: [trees.tree-dp, foundations.complexity]
    recommended: [graphs.dfs, foundations.binary-representation]
complexity:
    time: "O(n log n + m log m)"
    space: "O(n + m)"
assumptions:
    - The two inputs are rooted trees, and the root of each is marked by a parent of -1.
    - The comparison is probabilistic; equal hashes do not prove isomorphism.
implementations: trees.tree-hashing
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="trees.tree-hashing" />

<CodeViewer algorithm="trees.tree-hashing" />

Two rooted trees are isomorphic when one can be relabeled into the other while the root stays the root. The relabeling is a bijection on the vertices that preserves every parent-child relation, so the labels themselves carry no information: only the shape matters.

The technique assigns every vertex a fingerprint of its subtree. A leaf receives a fixed pair. An internal vertex collects the fingerprints of its children, sorts them so that the input order cannot matter, and folds the sorted sequence into a new pair with two 32-bit recurrences. Two trees are reported as the same exactly when their roots have the same pair and their sizes agree.

Each edge is touched a constant number of times, but sorting the children costs $O(k \log k)$ at a vertex of degree $k$, and the sum over the tree is $O(n \log n)$. The memory is linear. The test is one-sided: isomorphic trees always receive equal pairs, while non-isomorphic trees can collide with a probability that the two lanes make negligible in practice.

| Property | Value |
| --- | --- |
| **Problem** | Decide whether two rooted trees are isomorphic, ignoring vertex labels |
| **Time** | $O(n \log n + m \log m)$ |
| **Auxiliary space** | $O(n + m)$ |
| **Requires** | Rooted trees, and a canonical order for the children of every vertex |
| **Fails when** | The two fingerprint pairs collide, or an unrooted tree is compared without choosing a center |
| **Primary technique** | Hash each subtree from the sorted hashes of its children |
| **Related** | Tree dynamic programming, tree traversal, lowest common ancestor |

## Problem motivation

A build system keeps its source tree as a set of directories, and two releases of the same project are stored under different names. The migration tool has to decide whether the two releases have the same directory structure, ignoring the file names. A directory is a vertex, each entry is a child, and the root of the release is the root of the tree.

The constraints are the whole problem.

- $1 \le n \le 200\,000$ directories in each tree.
- The two trees may use completely different vertex numbers.
- The answer is a single bit, but the trees can be deep chains or wide stars.
- The comparison has to finish in the time of a few sorts, not in the time of a search over relabelings.

Checking every bijection is hopeless. A tree with $n$ vertices has up to $n!$ relabelings, and even a modest $n = 20$ gives more than $2 \ast 10^{18}$ candidates. The first useful baseline is a canonical string: recursively write the sorted canonical strings of the children inside a pair of parentheses. That string is correct, and its final length is only $2n$, but building it copies the child string at every vertex. On a chain the copies have lengths $2n-2, 2n-4, \dots, 2$, whose sum is $O(n^2)$.

The problem is the copying, not the recursion. A subtree needs to be represented by something whose size does not depend on the subtree. A fixed-size fingerprint is exactly that: the parent combines the fingerprints of its children arithmetically, and never looks inside them again.

## Recognition patterns

Tree hashing is the right tool when all of the following hold.

- The two inputs are **rooted trees**, or a root can be chosen canonically, as with the center of an unrooted tree.
- The **labels are irrelevant**: the answer must not change when the vertices are renumbered.
- The comparison is about **shape**, not about values stored at the vertices.
- The structure is **static**, so a fingerprint never has to be updated.
- Only **equality** is needed, not the relabeling that witnesses it.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 20$ | Enumerating relabelings, or comparing canonical strings, is already fast enough |
| The children are ordered and the order matters | Do not sort the child hashes; hash the sequence |
| The trees are unrooted | Find the center or the two centers first, then hash the rooted versions |
| The judge constructs an adversarial collision | Use exact canonical labels instead of a fixed hash |
| The tree changes between queries | Every fingerprint above the change is invalid |
| The inputs are general graphs | Graph isomorphism is a different and much harder problem |
| The question asks for the mapping itself | A hash answers equality only |

The phrases in a statement that signal this technique are "isomorphic as rooted trees", "the same shape after relabeling", "two trees can be drawn identically", and "determine whether the directory structures match". A statement that asks only for equal subtree sizes or depths is not this technique, because size and depth do not determine a rooted tree.

<Synonyms terms="tree hash, subtree hash, rooted tree isomorphism, canonical tree form" />

## Naive approach

The baseline is the canonical parenthesized string.

```python
def canonical(v):
    parts = sorted(canonical(c) for c in children[v])
    return "(" + "".join(parts) + ")"
```

It is correct, and it is the reference implementation for a differential test on small trees. Two trees are isomorphic exactly when their root strings are equal.

The cost is the problem. The string of a subtree has length twice its number of vertices, and the recursion copies the child strings into the parent at every level. On a chain of $n$ vertices the copies total $O(n^2)$ characters, and on a balanced tree they total $O(n \log n)$. A second baseline avoids the copying by assigning every distinct child tuple a fresh integer, which is the Aho-Hopcroft-Ullman algorithm. It is exact and runs in $O(n \log n)$ with sorting, but it needs a dictionary from tuples to labels and one shared label space for both trees.

The third baseline is brute force over relabelings. For each bijection from the first vertex set to the second, check every edge. There are $n!$ bijections, so this is only usable for $n \le 8$.

The hashing technique keeps the recursive shape of the canonical string and replaces the string with a pair of 32-bit integers. The dictionary of the exact algorithm disappears, and the comparison of two subtrees becomes a comparison of two numbers.

## Key insight

The insight is that rooted tree isomorphism is determined recursively by the **multiset** of child subtrees. A vertex has no value of its own, so its class is a function of the classes of its children and nothing else. If two vertices have the same multiset of child classes, they have the same class.

A multiset is awkward to process, but sorting turns it into a sequence. Once the child fingerprints are sorted, the input order of the children is irrelevant, and a fold over the sequence is a deterministic function of the multiset. This is the step that makes the hash well defined: the same tree with its children listed in any order produces the same sorted sequence.

The fold must not be linear in the child fingerprints. A plain scalar polynomial looks tempting, with a scalar child hash $z_i$:

$$
f_0 = 0,\qquad f_i = (B \ast f_{i-1} + z_i) \bmod 2^{32},\qquad h(v) = (B \ast f_k + 1) \bmod 2^{32}.
$$

It collapses. A chain of three vertices and a star with three vertices both receive $B^{2} + B + 1$: the single child of the chain's root already carries $B + 1$, while the star's two leaves fold to the same intermediate $B + 1$. Two different shapes, one fingerprint. The fix is a fixed nonlinear permutation of each child fingerprint before it enters the fold.

The implementation uses two lanes and two different permutations. For a vertex with children whose fingerprints are $(x_1, y_1), \dots, (x_k, y_k)$ sorted lexicographically, set

$$
a_0 = b_0 = 0,\qquad
a_i = (B_1 \ast a_{i-1} + \mu_1(x_i)) \bmod 2^{32},\qquad
b_i = (B_2 \ast b_{i-1} + \mu_2(y_i)) \bmod 2^{32},
$$

and define

$$
H(v) = \bigl((B_1 \ast a_k + 1) \bmod 2^{32},\; (B_2 \ast b_k + 1) \bmod 2^{32}\bigr).
$$

The constants are $B_1 = 1000003$ and $B_2 = 999983$. The permutations are fixed xorshift maps, not random values:

- $\mu_1$ applies $x \leftarrow x \oplus (x \ll 13)$, then $x \leftarrow x \oplus (x \gg 17)$, then $x \leftarrow x \oplus (x \ll 5)$.
- $\mu_2$ first adds $2654435769 = \texttt{0x9e3779b9}$, then applies shifts of $5$, $13$, and $17$ in the same alternating pattern.

Every operation is on 32-bit words. A leaf has no children, so $a_k = b_k = 0$, and its fingerprint is $(1, 1)$. The added $1$ is load-bearing: $0$ is a fixed point of the first xorshift map, and without the $1$ every tree would collapse to $0$ in the first lane, because the fold starts at $0$ and $\mu_1(0) = 0$.

Two lanes are used because one 32-bit lane is not enough at the stated constraints. Among $n$ subtrees there are about $n^{2} / 2$ pairs, and a 32-bit fingerprint collides on a pair with probability about $2^{-32}$, so the expected number of colliding pairs is about $n^{2} / 2^{33}$. At $n = 200\,000$ that is roughly five collisions somewhere in the tree, which is far too many. Two lanes move the bound to about $n^{2} / 2^{65}$, which is about $10^{-9}$ at the same size. The bound is heuristic, not a proof, and the section on correctness states exactly what is and is not guaranteed.

## Visual intuition

Draw the two trees with the root at the top. The labels are different, but the branching pattern is the same.

```text
        first tree                 second tree

            0                          0
           / \                        / \
          1   2                      1   2
         / \                               / \
        3   4                             3   4
```

The two trees are isomorphic, and the witness is the relabeling that sends the internal child of the root of the first tree to the internal child of the root of the second tree. A label-based comparison would notice the difference immediately; a shape-based comparison must not.

Hash the leaves first. Every leaf is a pair of ones. Then move upward: a vertex can be hashed as soon as all of its children have hashes, so the arrows point from the leaves toward the root.

For the first tree the pairs are:

| Vertex | Children | Sorted child pairs                 | Fingerprint                |
| ------ | -------- | ---------------------------------- | -------------------------- |
| 3      | none     | empty                              | $(1, 1)$                   |
| 4      | none     | empty                              | $(1, 1)$                   |
| 2      | none     | empty                              | $(1, 1)$                   |
| 1      | 3, 4     | $(1, 1), (1, 1)$                   | $(4063582541, 1270087041)$ |
| 0      | 1, 2     | $(1, 1), (4063582541, 1270087041)$ | $(619259475, 3409007363)$  |

The second tree has the same multiset at the root: one leaf child and one child with two leaves. Its root therefore receives the same pair, $(619259475, 3409007363)$, even though the vertex that carries the deeper subtree is numbered differently.

The values are large, but the comparison never looks at them one bit at a time. It compares two pairs for equality, and the entire shape of a subtree has already been compressed into those two words.

A different pair of trees shows what the hash rejects. A chain of four vertices and a star with four vertices have the same number of vertices and the same root, but different fingerprints: the chain hashes to $(273640478, 1624508861)$ and the star hashes to $(1404821896, 1906048201)$. One comparison is enough to separate them.

## Formal model

::: math definition Definition
A **rooted tree** is a finite set of vertices with a distinguished vertex $r$, the root, and a parent for every vertex other than $r$, such that following parents from any vertex reaches $r$. The **children** of $v$ are the vertices whose parent is $v$, and the **subtree** $T_v$ is the rooted tree formed by $v$ and all of its descendants.
:::

::: math definition Definition
Two rooted trees $T$ with root $r$ and $T'$ with root $r'$ are **isomorphic** when there is a bijection $\varphi$ from the vertices of $T$ to the vertices of $T'$ such that $\varphi(r) = r'$ and, for every vertex $v \ne r$, the parent of $\varphi(v)$ is $\varphi(\text{parent}(v))$. Equivalently, $\varphi$ maps the children of every vertex bijectively onto the children of its image.
:::

::: math definition Definition
The **fingerprint** of a rooted tree is a pair $(h_1, h_2)$ of 32-bit words. Let the child fingerprints of a vertex be $(x_1, y_1), \dots, (x_k, y_k)$ in lexicographic order. With $a_0 = b_0 = 0$ and the recurrences of the key insight, the fingerprint of the vertex is

$$
\bigl((B_1 \ast a_k + 1) \bmod 2^{32},\; (B_2 \ast b_k + 1) \bmod 2^{32}\bigr).
$$
:::

::: math lemma Lemma
Isomorphic rooted trees have equal fingerprints.
:::

::: math proof Proof
Induct on the height of the trees. For a leaf, both trees consist of a single vertex, both have an empty child list, and both fingerprints are $(1, 1)$.

For an internal vertex, let $\varphi$ be an isomorphism. It maps the children of the root of $T$ bijectively onto the children of the root of $T'$, and it restricts to an isomorphism between the subtree of each child $c$ and the subtree of $\varphi(c)$. By the induction hypothesis, $T_c$ and $T_{\varphi(c)}$ have the same fingerprint. The multiset of child fingerprints is therefore the same on both sides. Sorting turns the multiset into the same sequence, the two folds apply the same deterministic operations in the same order, and the resulting pairs are equal.
:::

::: math theorem Theorem (the limits of the fingerprint)
Equal fingerprints do not imply isomorphism.
:::

::: math proof Proof
There are finitely many pairs of 32-bit words and infinitely many rooted trees, so no function into the pairs can be injective on all trees. Even with $n$ bounded by $200\,000$, a collision is possible in principle. The algorithm is therefore one-sided: it never rejects isomorphic trees, but it can accept a pair of non-isomorphic trees whose root fingerprints happen to agree.
:::

::: math invariant Invariant
Before the postorder processes a vertex $v$, every child of $v$ already carries the fingerprint of its own subtree. After $v$ is processed, its stored pair is the fingerprint defined above, computed from the sorted child pairs.
:::

The invariant is what makes the implementation a single pass: a vertex is processed only after its children, so the fold never reads a value that has not been finalized.

## Algorithm derivation

The state is the parent array, the children lists, one postorder, and two arrays of fingerprints.

1. **Find the root.** The input marks the root with a parent of $-1$. If the input has no such vertex, the first vertex is treated as the root; the contract of the program assumes that exactly one root exists.
2. **Build the children lists.** Count the children of every vertex, take prefix sums, and place each vertex into the block of its parent. This is the usual compact adjacency representation, and it costs $O(n)$.
3. **Build an order.** Start a queue at the root and append the children of every vertex as it leaves the queue. Every parent enters the queue before its children, so this is a preorder. Reversing the order puts every child before its parent.
4. **Hash in reverse order.** For each vertex, copy the fingerprints of its children into a scratch buffer, sort the buffer lexicographically by the first component and then by the second, fold both lanes, and store the result.
5. **Compare.** If the two trees have different sizes, they are different. Otherwise compare the root fingerprint pairs.

The core of the hash step is short:

```cpp
std::sort(buffer.begin(), buffer.begin() + degree, less);
std::uint32_t fold_first = 0;
std::uint32_t fold_second = 0;
for (int i = 0; i < degree; i++) {
    fold_first = fold_first * kBaseFirst + mix_first(buffer[i].first);
    fold_second = fold_second * kBaseSecond + mix_second(buffer[i].second);
}
first[v] = fold_first * kBaseFirst + 1;
second[v] = fold_second * kBaseSecond + 1;
```

The unsigned type is doing real work. In C and C++, `std::uint32_t` arithmetic wraps modulo $2^{32}$ by definition, so the masks in the recurrence are implicit. In Java, JavaScript, Python, and Pascal the reduction is explicit, which is why the walkthrough treats those languages separately.

The `+ 1` after the fold gives a leaf the pair $(1, 1)$. It also keeps the first lane away from $0$, the fixed point of the first xorshift permutation. Without it, every tree would produce $0$ in that lane, because the leaf would start at $0$ and the permutation would preserve it.

The two lanes use different bases and different permutations on purpose. If both lanes applied the same function to the same values, the second lane would repeat the first, and the pair would be no stronger than a single 32-bit word. Different maps make a collision satisfy two different equations.

## Step-by-step execution

Take the five-vertex tree of the visual intuition, with the parent array `-1 0 0 1 1`. Vertex 0 is the root, vertices 1 and 2 are its children, and vertices 3 and 4 are the children of 1.

The breadth-first order is $0, 1, 2, 3, 4$, and the reverse order is $4, 3, 2, 1, 0$.

**Vertices 4, 3, and 2.** Each is a leaf, so its child list is empty, both folds stay at $0$, and the fingerprint is $(1, 1)$.

**Vertex 1.** Its children are 3 and 4, both with fingerprint $(1, 1)$. The sorted sequence is $(1, 1), (1, 1)$. In the first lane,

$$
\mu_1(1) = 270369,\qquad
a_1 = 270369,\qquad
a_2 = (1000003 \ast 270369 + 270369) \bmod 2^{32} = 4082109124,
$$

so

$$
h_1 = (1000003 \ast 4082109124 + 1) \bmod 2^{32} = 4063582541.
$$

In the second lane, $\mu_2(1) = 1219135544$, the fold reaches $2455763584$, and

$$
h_2 = (999983 \ast 2455763584 + 1) \bmod 2^{32} = 1270087041.
$$

The fingerprint of vertex 1 is $(4063582541, 1270087041)$.

**Vertex 0.** Its children are 1 and 2, with fingerprints $(4063582541, 1270087041)$ and $(1, 1)$. Sorted lexicographically, the leaf comes first. The first lane starts with $a_1 = \mu_1(1) = 270369$. Then

$$
\mu_1(4063582541) = 2055630243,\qquad
a_2 = (1000003 \ast 270369 + 2055630243) \bmod 2^{32} = 1842501702,
$$

and

$$
h_1 = (1000003 \ast 1842501702 + 1) \bmod 2^{32} = 619259475.
$$

The second lane gives $b_2 = 98870942$ and $h_2 = 3409007363$. The root fingerprint is $(619259475, 3409007363)$.

Now take the second tree, with parent array `-1 0 0 2 2`. Its vertices 1 and 2 have swapped roles. Vertex 1 is now the leaf, vertex 2 is the internal vertex with two leaves, and the root's children have fingerprints $(1, 1)$ and $(4063582541, 1270087041)$ again. The sorted sequence is identical, so the root's fold is identical, and the program prints `SAME` after the size check succeeds.

The order of the processing matters in one place only: the reverse breadth-first order guarantees that the children of a vertex are already finished. It does not matter whether the order is breadth-first or depth-first, as long as the reverse is a postorder.

## Correctness proof

::: math theorem Theorem
If the two input trees are isomorphic as rooted trees, the program prints `SAME`.
:::

::: math proof Proof
Let the trees be $T$ and $T'$, with roots $r$ and $r'$, and let $\varphi$ be an isomorphism. Both trees have the same number of vertices, so the size test passes.

The claim is that every vertex $v$ of $T$ and its image $\varphi(v)$ receive the same fingerprint. Prove it by induction on the height of $v$. For a leaf, both subtrees are single vertices, both child lists are empty, and both fingerprints are $(1, 1)$.

For an internal vertex, $\varphi$ maps the children of $v$ bijectively onto the children of $\varphi(v)$, and each child $c$ is sent to a vertex whose subtree is isomorphic to $T_c$. By the induction hypothesis, $c$ and $\varphi(c)$ have equal fingerprints. The multiset of child fingerprints at $v$ therefore equals the multiset at $\varphi(v)$. Sorting both multisets produces the same sequence, and the fold is a deterministic function of that sequence, so the two parent fingerprints are equal.

Applying the claim to the roots gives equal root pairs, so the program prints `SAME`.
:::

::: math lemma Lemma
The reverse of the breadth-first order is a postorder: every child appears before its parent.
:::

::: math proof Proof
A breadth-first traversal appends a vertex only when it processes the parent of that vertex, so every parent is appended before all of its children. Reversing the list therefore places every child before its parent. The traversal visits every vertex reachable from the root, which is the whole tree by the definition of a rooted tree.
:::

::: math theorem Theorem
If the program prints `SAME`, the trees have equal root fingerprints and equal sizes; this is evidence of isomorphism, not a proof of it.
:::

::: math proof Proof
The output condition is exactly the equality of the two sizes and the two root pairs. The theorem on the limits of the fingerprint exhibits the gap: the fingerprint map is not injective, so two non-isomorphic trees can share a root pair. The probability of such a collision is the subject of the complexity analysis.
:::

The proof of the first theorem is the important one for a contestant. It says that the algorithm has no false negatives: every isomorphic pair is accepted. A false positive requires a collision in both lanes at the root, which is possible but rare under the stated constants.

## Complexity analysis

**Building the children lists: $O(n)$.** The parent array is read once, the counts are accumulated in one pass, the prefix sums in another, and each vertex is placed into its parent's block once.

**Building the order: $O(n)$.** Every vertex enters the queue exactly once, and every edge is examined once.

**Hashing: $O(n \log n)$.** A vertex with $k$ children sorts $k$ pairs at a cost of $O(k \log k)$ and folds them in $O(k)$. The sum of the $k$ over all vertices is $n - 1$, and $\sum k \log k \le (n - 1) \log(n - 1)$, so the total sorting cost is $O(n \log n)$. The fold costs $O(n)$.

**Comparing: $O(1)$.** Two sizes and two pairs.

**Space: $O(n)$.** The parent array, the prefix sums, the children list, the order, the scratch buffer, and the two fingerprint arrays each hold $O(n)$ words.

For two trees of sizes $n$ and $m$, the total is $O(n \log n + m \log m)$ time and $O(n + m)$ space, which is $O((n + m) \log(n + m))$ when the sizes are comparable.

::: math complexity Complexity
Two rooted trees of $n$ and $m$ vertices: $O(n \log n + m \log m)$ time and $O(n + m)$ auxiliary space.
:::

The collision bound deserves its own paragraph. Model the two lanes as independent random 32-bit values. Two distinct subtrees collide with probability about $2^{-64}$, and there are at most $(n + m)^{2} / 2$ pairs of subtrees, so the probability that any pair collides is at most about $(n + m)^{2} / 2^{65}$. At $n + m = 400\,000$ that is about $4 \ast 10^{-9}$. The model is a heuristic, because the lanes are deterministic and an adversary who knows the constants could search for a collision. A contest with fixed tests is not such an adversary; a judge that constructs tests against a published hash is.

The canonical-string baseline is $O(n^{2})$ in the worst case and $O(n \log n)$ on a balanced tree. The exact Aho-Hopcroft-Ullman algorithm is $O(n \log n)$ with sorting and has no collision probability, but it needs a dictionary and a shared label space. Hashing trades the dictionary for two 32-bit words.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Two rooted trees, labels irrelevant | Tree hashing, as in this article |
| The judge may construct an adversarial collision | Exact canonical labels with a dictionary |
| The trees are unrooted | Find the centers, then hash the rooted versions |
| A subtree is compared with many others in one tree | Store the hashes and group them in a map |
| The children have a meaningful order | Hash the child sequence without sorting |
| The answer must include the relabeling | A recursive matching with backtracking, not a hash |
| The tree changes between queries | Rebuild the affected fingerprints, or use a dynamic structure |
| The inputs are general graphs | Graph isomorphism, which is outside this technique |
| $n \le 20$ | A canonical string or brute force is simpler and exact |

The exact algorithm is worth knowing even when hashing is used. Assign every distinct sorted tuple of child labels the next unused integer, processing the vertices of both trees in one shared label space in postorder. Two subtrees are isomorphic exactly when their labels are equal. The labels are canonical, so no collision is possible, but the dictionary operations and the tuple storage make the constant larger. The hash is the version to write under time pressure; the exact version is the version to write when a wrong answer is unacceptable and the input is adversarial.

## Reference implementations

The six programs share one contract. The input is $n$, then $n$ parents with $-1$ marking the root, then $m$, then $m$ parents for the second tree. Every parent other than $-1$ is a 0-based vertex index. The output is `SAME` when the rooted trees are isomorphic and `DIFFERENT` otherwise.

All six build the children lists in compact form, produce a breadth-first order, reverse it, and hash the vertices in that order. They sort the child pairs lexicographically, fold two 32-bit lanes, and compare the root pairs after the size check. The differences are language mechanics:

- **C** stores the lanes in `uint32_t`, so the arithmetic wraps modulo $2^{32}$ and `qsort` sorts the pairs.
- **C++17** keeps the same arithmetic in `std::uint32_t` and sorts with `std::sort`.
- **Java** stores the lanes in `long`, packs a child pair into one `long`, flips the sign bit so that the signed sort agrees with the unsigned order, and is named `Main` so it can be submitted unchanged.
- **Python** masks every operation with `(1 << 32) - 1` and sorts tuples.
- **JavaScript** keeps every intermediate below $2^{53}$, so the multiplication is exact, and reduces each lane with `>>> 0`.
- **Pascal** keeps the lanes in `Int64`, masks with $4294967295$, and sorts with a merge sort that uses one shared scratch array. No 128-bit integer is needed.

The JavaScript and Pascal listings are educational references; neither language is a USACO submission language. The C, C++17, Java, and Python listings are ordinary programs that read standard input and write standard output.

## Recursion decision

The recurrence is naturally recursive, but the tree traversal is not. A chain of $200\,000$ vertices would need $200\,000$ stack frames, and every mainstream runtime refuses that.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | Iterative; a chain of $n$ vertices needs $n$ frames |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | 1000 frames | Iterative; raising the limit does not enlarge the C stack |
| Pascal | The operating system stack | Depends on the platform | Iterative |
| JavaScript | The V8 engine limit | About $10^4$ frames | Iterative; the engine throws a `RangeError` |

The implementations use a queue and a reversed order, so the only recursive routine in the listings is the merge sort in the Pascal listing. That recursion has depth $O(\log n)$, because it halves the child list, and it is safe even on the largest allowed input. The C `qsort` and the other standard sorts have the same logarithmic depth.

## Implementation walkthrough

The first decision is the children representation. The input gives a parent for every vertex, so a list of vectors is the obvious structure, but a compact block is faster and uses less memory. Count the children of each vertex, turn the counts into prefix sums, and write each vertex into the next free slot of its parent's block. The resulting `start` array has $n + 1$ entries, and the children of vertex $v$ are the entries from `start[v]` to `start[v + 1] - 1`.

The second decision is the order. A depth-first traversal is the usual way to obtain a postorder, but its recursion is exactly what the previous section forbids. A breadth-first queue is iterative and gives a preorder; reversing that list gives a valid postorder without any stack beyond the queue itself. The reverse is valid because a tree has no cross edges: every vertex except the root has exactly one parent, and the queue reaches a vertex through that parent.

The third decision is the sort key. The child fingerprints are pairs, and a lexicographic comparison by the first component and then the second is a total order. In Java the pair is packed into one `long`:

```java
final long packed = (first[c] << 32) | second[c];
keys[degree++] = packed ^ Long.MIN_VALUE;
```

Flipping the sign bit turns the signed comparison of `long` into the unsigned comparison of the packed 64-bit word. Without the flip, a first component with its top bit set would sort before a smaller first component, and the fold would depend on the language rather than on the tree.

The fourth decision is the arithmetic width. The products in the fold are at most $(2^{32} - 1) \ast 1000003$, which is below $2^{52}$. That is why the Pascal and JavaScript versions can use their ordinary integer type and a mask without losing precision: both can represent every integer below $2^{53}$ exactly. In C and C++ the same products are reduced by the unsigned type, and in Java the `long` is wide enough.

The fifth decision is the size check. The root fingerprint alone does not record the number of vertices, so a collision between trees of different sizes is possible in principle. Comparing the sizes first makes the common case of different inputs a constant-time rejection and removes that gap from the hash's burden.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Including the vertex label in the hash | The same shape with different labels receives different pairs | Hash only the child fingerprints |
| Folding the children in input order | The same tree with two children listed in the other order is rejected | Sort the child pairs first |
| Using a plain polynomial without a nonlinear mix | A chain of three and a star of three collide | Apply a fixed permutation before each fold step |
| Using only subtree size and height | Many different trees share both values | Hash the multiset of child fingerprints |
| Using one 32-bit lane | About five expected collisions among $200\,000$ subtrees | Use two lanes with different bases and maps |
| Recursing on the tree | A chain overflows the stack | Build an iterative order and reverse it |
| Forgetting the size check | A hash collision across sizes becomes a false `SAME` | Compare the sizes before the fingerprints |
| Rooting an unrooted tree at vertex 0 | Isomorphic trees can receive different rooted shapes | Root at the centers |
| Comparing the root pair of the wrong tree | The second root is not necessarily vertex 0 | Store the root index with each tree |

### Why this fails: the unsorted fold

The smallest counterexample to an unsorted fold has four vertices. Take these two parent arrays:

```text
first:   -1 0 0 2      second:  -1 0 0 1
```

In the first tree, vertex 0 has children 1 and 2; vertex 1 is a leaf, and vertex 2 has child 3. In the second tree, vertex 0 has children 1 and 2; vertex 1 has child 3, and vertex 2 is a leaf. The two trees are isomorphic: the relabeling that swaps 1 and 2 is the witness.

A fold that walks the children in index order sees the sequence `leaf, chain` in the first tree and `chain, leaf` in the second. The two sequences are different, so the parent fingerprints are different, and the program prints `DIFFERENT` for an isomorphic pair. With three vertices the only shapes are a chain and a root with two leaves, and the two children of the star are indistinguishable, so no ordering mistake can show up. Four vertices is the smallest case with two distinct child subtrees. Sorting the child pairs removes the mistake entirely.

### Why this fails: the linear polynomial

The smallest counterexample to a plain polynomial has three vertices. Take the chain `-1 0 1` and the star `-1 0 0`. Both have three vertices, and they are not isomorphic: the chain has height two, and the star has height one.

The collapsing recurrence is $h(v) = (B \ast f + 1) \bmod 2^{32}$, where $f$ starts at $0$ and is updated as $f \leftarrow B \ast f + h(c)$ for every child in order. For the chain, the middle vertex has $f = 1$ and hash $B + 1$; the root has one child, so $f = B + 1$ and hash $B \ast (B + 1) + 1 = B^{2} + B + 1$. For the star, the root has two leaf children: $f$ becomes $1$ after the first and $B + 1$ after the second, so the hash is again $B \ast (B + 1) + 1 = B^{2} + B + 1$. Equal hashes, different shapes.

The nonlinear permutation breaks the coincidence. With the real constants, the chain hashes to $(4158608162, 2835941352)$ and the star to $(4063582541, 1270087041)$, so the smallest non-isomorphic pair is separated.

The general lesson is that a hash whose parent operation is linear in the child hashes records only a weighted sum of the leaves. Nesting depth and branching order disappear into the same total. A permutation before each fold step makes each child's contribution nonlinear, and the two shapes separate.

## Variants and extensions

- **Unrooted trees.** Find the center or the two centers by peeling leaves, root the tree there, and compare the rooted fingerprints. If there are two centers, compare both pairings.
- **Exact canonical labels.** Replace the numeric fold with a dictionary from sorted child-label tuples to fresh integers. The result is collision-free and still $O(n \log n)$ with a good dictionary.
- **Forests.** Hash every root and compare the sorted list of root fingerprints. The size check becomes a check of the total number of vertices.
- **Duplicate subtree queries.** Store every subtree fingerprint in a map from pair to count, and answer "how many copies of this shape" in constant time per query after the build.
- **Symmetry of a rooted tree.** Group the children by fingerprint; every group must have even size, except possibly one, whose child must itself be symmetric. This is the technique behind the third worked problem.
- **A randomly chosen base.** Choosing $B_1$ and $B_2$ at run time from a fixed seed or from the clock defeats an adversary who knows the constants. The reference programs use fixed constants because their output must be reproducible, but a contest submission can randomize.
- **One 64-bit lane.** On a platform with exact 64-bit arithmetic, a single 64-bit hash replaces the pair. The pair is the portable choice: it works in Pascal and JavaScript without 128-bit integers.
- **Ordered trees.** If the order of the children is part of the structure, do not sort. Fold the child fingerprints in their given order, and the same recurrence becomes a hash of an ordered tree.
- **Tree edit distance.** The fingerprint answers equality only. Measuring how different two trees are is a different dynamic program.

## Contest strategy

Under contest pressure, the mistakes above are what cost points, and each is avoidable with a fixed procedure.

1. Root both trees first. If the statement gives a root, use it; if not, find the centers before doing anything else.
2. Build the children lists and an iterative postorder. Do not write a recursive traversal until you have checked the maximum depth.
3. Sort the child fingerprints at every vertex. If the children are ordered by the problem, skip the sort deliberately, not by accident.
4. Use two 32-bit lanes with different bases and different permutations. Write the masks explicitly in languages without unsigned 32-bit arithmetic.
5. Compare the sizes before the fingerprints. A different number of vertices is an immediate `DIFFERENT`.
6. Test the five shapes explicitly: a single vertex, a chain, a star, two different labelings of the same tree, and two trees with the same size and height but different shapes.
7. Write the canonical-string baseline for small $n$ and compare on random trees. A disagreement is either a bug or a collision, and both are worth investigating.

The last test is the one that catches the subtle bugs. The same-size, same-height pair `-1 0 0 1 2` and `-1 0 0 2 2` is especially useful, because a hash that records only the size and the height accepts it, while a hash of the child multiset rejects it.

## Worked problems

### Problem 1: Tree Isomorphism I

**Restatement.** The input contains $t$ tests. Each test gives $n$, then $n - 1$ edges of the first tree, then $n - 1$ edges of the second tree. Both trees are rooted at node 1, and the answer for each test is `YES` when they are isomorphic as rooted trees and `NO` otherwise.

**Constraints.** $1 \le t \le 1000$, $2 \le n \le 100\,000$, and the sum of $n$ over all tests is at most $100\,000$. A single test can be a chain, so a recursive traversal needs $100\,000$ frames.

**Naive baseline.** Build the canonical parenthesized string of both trees. The strings are correct, but the copying along a chain is quadratic.

**Insight.** A rooted tree is determined by the multiset of its child subtrees, and a hash compresses each subtree to a constant-size pair.

**Derivation.** Read the edges into an adjacency list, root the first tree at node 1, and run the postorder hash. Do the same for the second tree and compare the root pairs. The total work is $O(n \log n)$ per test, and the sum of the tests is bounded by the total $n$.

**Correctness.** The theorem above shows that isomorphic rooted trees receive equal pairs. The size check is automatic here because both trees have the same $n$.

**Complexity.** $O(n \log n)$ time and $O(n)$ space per test.

**Common wrong approach.** Comparing the degree sequences of the two trees. Two trees can have the same degree multiset and different shapes, so the degree sequence is necessary but not sufficient. The child-multiset hash is the sufficient version.

### Problem 2: Tree Isomorphism II

**Restatement.** The same input as the first problem, but the trees are not rooted. The answer is `YES` when the two unrooted trees are isomorphic.

**Constraints.** $1 \le t \le 1000$, $2 \le n \le 100\,000$, and the sum of $n$ is at most $100\,000$.

**Naive baseline.** Try every pair of roots: $n^{2}$ pairs per test, each costing a rooted hash. That is $O(n^{3} \log n)$ in the worst case, which is far too slow.

**Insight.** An isomorphism preserves distances, so it maps the center set of one tree onto the center set of the other. A tree has one center or two adjacent centers.

**Derivation.** Find the centers by repeatedly removing the leaves until one or two vertices remain, or by taking the middle of a longest path. Root the first tree at each center, hash it, and do the same for the second tree. If the numbers of centers differ, the trees are not isomorphic. If both trees have one center, compare the two rooted fingerprints. If both have two centers, compare the two possible pairings and accept when either pairing matches.

**Correctness.** Every tree has one or two centers, and the center set is an isomorphism invariant. An isomorphism between two trees therefore restricts to a bijection between their center sets, which is either the unique pair of centers or one of the two pairings of the two-center sets. The corresponding rooted trees are isomorphic, so the rooted test accepts.

**Complexity.** Finding the centers is $O(n)$ with leaf peeling, and each rooted hash is $O(n \log n)$. There are at most two roots per tree, so the total is $O(n \log n)$ per test.

**Common wrong approach.** Rooting both trees at vertex 1. The label 1 can be a leaf in one tree and a center in the other. A path of four vertices with the labels `1-2-3-4` and the same path with the labels `2-1-3-4` are isomorphic, but rooting both at 1 gives a chain in the first and a root with a leaf and a chain in the second. The rooted hashes differ even though the unrooted trees are the same.

### Problem 3: Symmetree

**Restatement.** A tree with $n$ vertices is rooted at vertex 1. It is symmetric when its children can be ordered so that the leftmost child's subtree is a mirror image of the rightmost child's subtree, the second-left is a mirror image of the second-right, and so on; if the number of children is odd, the middle child's subtree must itself be symmetric. The same condition applies recursively to every subtree. Decide for each test whether the tree is symmetric.

**Constraints.** $1 \le t \le 10^{4}$, $1 \le n \le 200\,000$, and the sum of $n$ over all tests is at most $200\,000$. A vertex can have $200\,000$ children.

**Naive baseline.** Try every ordering of the children and every mirror pairing. The number of orderings is factorial in the degree, and a star with $200\,000$ vertices already has $199\,999!$ of them.

**Insight.** Two children can be paired exactly when their subtrees are isomorphic, and only the parity of each fingerprint class matters at one vertex. At most one class can have an odd count, and that class must contain a symmetric child.

**Derivation.** Compute the subtree fingerprint of every vertex in postorder. At a vertex, group the child fingerprints by pair and count each group. If every count is even, the vertex is symmetric. If exactly one count is odd, the vertex is symmetric exactly when a child in that group is symmetric. If two or more counts are odd, the vertex is not symmetric. The root's flag is the answer.

**Correctness.** The definition pairs child subtrees that are mirror images, which for unordered rooted trees is the same as pairing them by isomorphism. Within a fingerprint class, every two children can be paired, so all but at most one child of that class are matched immediately. The unmatched child, if any, has to be symmetric for the middle position. Conversely, a valid ordering pairs children within the same class, so the parity condition is necessary. Induction on the height proves that the flag is exact, up to fingerprint collisions.

**Complexity.** The hashing is $O(n \log n)$; grouping the child fingerprints takes $O(n \log n)$ with sorting or $O(n)$ expected with a hash map. The space is $O(n)$.

**Common wrong approach.** Checking only that every depth level has an even number of vertices, or that every vertex has an even number of children. A vertex with three children can be symmetric if one child is the middle, and a vertex with an even number of children can fail when the classes do not pair up.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for rooted tree isomorphism. Look for "same shape", "relabeling", and a root that is part of the input.
2. **Direct application.** Implement the postorder hash and test it on the five shapes: single vertex, chain, star, two labelings of one tree, and a pair with the same size and height but different shapes.
3. **Adaptation.** Write the unrooted version. Find the centers, handle the one-center and two-center cases, and compare against the rooted version on random small trees.
4. **Combination.** Use the fingerprints to count duplicate subtrees, or to test the symmetry of every vertex in one pass. Combine the hash with a dictionary from pair to class.
5. **Challenge.** Solve a problem where the trees are given as strings, or where the root is not fixed and the centers must be found without building the whole adjacency list.
6. **Transfer.** Use the same idea on a trie, on a parse tree, or on the directory tree of a build system. The recurrence is about the multiset of children, not about the specific problem.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the fingerprint of a vertex depend on, and what does it deliberately ignore? (Formal model)
2. Why must the child fingerprints be sorted before the fold? (Key insight)
3. What is the smallest pair of non-isomorphic trees that a plain polynomial hash confuses, and why? (Why this fails)
4. What is the smallest tree on which an unsorted fold gives a wrong answer? (Why this fails)
5. Why does the algorithm use two lanes instead of one 32-bit lane? (Key insight, Complexity analysis)
6. Why is the reverse of a breadth-first order a valid postorder? (Correctness proof)
7. What does the added $1$ in the recurrence prevent? (Algorithm derivation)
8. Why is the size comparison separate from the fingerprint comparison? (Implementation walkthrough)
9. How do you reduce an unrooted tree to a rooted one? (Algorithm selection, Worked problems)
10. When is the exact Aho-Hopcroft-Ullman labeling preferable to a hash? (Algorithm selection)

## Further reading

- The technique that answers ancestor queries on a tree is [lowest common ancestor](/algorithms/trees/lca).
- The bottom-up dynamic programming that this hash generalizes is [tree dynamic programming](/algorithms/trees/tree-dp).
- The traversal that produces the order used by the implementation is [breadth-first search](/algorithms/graphs/bfs); its reverse is the postorder the hash needs. A [depth-first search](/algorithms/graphs/dfs) produces a postorder directly, but only with an explicit stack.
- The first worked problem is [Tree Isomorphism I](https://cses.fi/problemset/task/1700), and the unrooted extension is [Tree Isomorphism II](https://cses.fi/problemset/task/1701).
- The symmetry application is [Symmetree](https://codeforces.com/problemset/problem/1800/G).
- The canonical labeling that removes the collision probability is the Aho-Hopcroft-Ullman algorithm, described in the textbook "The Design and Analysis of Computer Algorithms" by Aho, Hopcroft, and Ullman.
