---
id: advanced.sprague-grundy
title: Game theory and Sprague-Grundy theory
summary: Summarize every impartial game position by one non-negative integer, its Grundy value, so that a sum of independent games is decided by the xor of those values.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [
        Sprague-Grundy theorem,
        Grundy number,
        nimber,
        mex,
        Nim,
        impartial game,
        disjunctive sum,
        game theory,
    ]
prerequisites:
    required: [foundations.complexity]
    recommended:
        [foundations.recursion, foundations.binary-representation, dynamic-programming.dag-dp]
complexity:
    time: "O(M k + h) to tabulate the Grundy values up to the largest heap, where k moves are allowed"
    space: "O(M + k)"
assumptions:
    - Every game is finite and impartial, and the player who cannot move loses; the player who makes the last move wins.
    - The position is a disjunctive sum of independent components, so exactly one component changes per move.
    - The Grundy table is built up to the largest heap size in the input, and every legal move removes a fixed positive number of stones.
implementations: advanced.sprague-grundy
reviewed: false
---

<AlgorithmSummary algorithm="advanced.sprague-grundy" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="advanced.sprague-grundy" />

## At a glance

The Sprague-Grundy theorem assigns to every position of a finite impartial game a single non-negative integer, its **Grundy value**, written $g$. The value is defined by

$$
g(v) = \operatorname{mex}\{ g(u) : u \text{ is reachable from } v \},
$$

where $\operatorname{mex}$ is the smallest non-negative integer missing from the set. A position has $g = 0$ exactly when the player to move loses under optimal play.

The theorem is what makes the value useful. If a position is a sum of independent games, where a move touches exactly one of them, then the Grundy value of the whole position is the bitwise XOR of the values of its parts:

$$
g(G + H) = g(G) \oplus g(H).
$$

So a game with several heaps is solved by tabulating $g$ for one heap, taking the XOR of the heaps, and testing whether the result is zero. At a glance, the whole technique is two ideas: one number per position, and XOR to combine them.

The work is in the table. For a subtraction game with heaps up to $M$ and $k$ allowed move sizes, the table costs $O(M k)$ time and $O(M + k)$ space, and each heap is then answered in $O(1)$. The naive alternative is a search over all play sequences, whose size grows exponentially with the number of moves available.

## Problem motivation

A casino night has a row of tables, each holding one heap of stones. The rules are the same at every table: a player names one of the allowed amounts, and removes that many stones from one non-empty heap. The amounts are fixed in advance and may skip values. The player who cannot move loses.

A customer plays one table at a time. The manager wants to know, before the evening starts, which starting configurations are wins for the first player. A configuration is a list of heap sizes, and the tables are independent: a move at one table never changes another.

The direct approach answers the question by search. From a configuration, try every legal move at every heap, and declare the configuration a win when some move leads to a losing configuration. The recursion is correct, but its state space is the product of the heap sizes. With ten heaps of size twenty and two allowed moves per heap, the search visits about $21^{10}$ configurations, which is thousands of times the number of seconds in a century.

The observation that collapses the search is that the heaps do not interact. If each heap were summarized by one number, the summary of the whole configuration would be a combination of those numbers, and the combination would not enumerate the tuples. The Sprague-Grundy theorem says that such a summary exists, that the number is computable from the single-heap game alone, and that the combination is XOR.

The same idea answers a much wider class of games, including games whose moves split one heap into several. There the summary of a split position is the XOR of the summaries of the new heaps, so the single-heap table and the combination rule are the same two ideas again.

## Recognition patterns

Sprague-Grundy theory is the right tool when the statement contains some of these phrases.

- "Two players take turns", "both play optimally", "the player who cannot move loses".
- "Remove any number of stones from one pile", "the piles are independent", "a move affects exactly one pile".
- "Split one pile into several", "replace a pile by several smaller piles".
- "The same move may not be used twice", with the restriction scoped to one pile.
- "Who wins", rather than "how many moves" or "how many ways".
- A position that is a collection of identical or independent parts, with no interaction between parts.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| Two players, both play optimally, last move wins | Normal play, the theory applies |
| A single heap with a simple move set | A direct ground-up DP, no XOR needed |
| Many independent heaps | Sprague-Grundy, with XOR across heaps |
| A move splits one component into several | Sprague-Grundy with a XOR inside the mex |
| The player who cannot move **wins** | Misère play, a different theory outside this article |
| The two players have different move sets | A partizan game, not an impartial one |
| A move may revisit a previous position | The game graph has a cycle, so the theory needs a draw analysis |
| The question asks for a count of games or strategies | A counting DP, not a win or loss value |
| The question asks for the number of moves under optimal play | The Grundy value alone does not answer it |

The misère row is the one that most often catches a contestant. Misère Nim is a solved special case with its own rule, and misère subtraction games do not follow the XOR rule at all. Read the phrase "the player who cannot move wins" and stop applying this technique.

## Naive approach

The baseline is the win-and-loss recursion over the whole configuration.

```cpp
// True when the player to move wins from this list of heap sizes.
bool wins(std::vector<int> heaps) {
    for (int i = 0; i < (int)heaps.size(); ++i) {
        for (int m : moves) {
            if (heaps[i] < m) continue;
            std::vector<int> next = heaps;
            next[i] -= m;
            if (!wins(next)) return true;   // the opponent is lost
        }
    }
    return false;   // no move at all, or every move hands over a win
}
```

This is correct: it is the definition of the game, and it is the reference implementation for a differential test on tiny inputs. Its problem is the state. The call tree visits every reachable tuple of heap sizes, and the tuples multiply, so the cost is the product of the heap sizes rather than their sum.

A second baseline is the "xor of the heap sizes" guess. It is correct for ordinary Nim, where every removal amount is allowed, and there the Grundy value of a heap of size $s$ happens to be $s$. It is wrong for any move set with gaps. With the allowed amounts $\{2, 3\}$, a heap of size $5$ has Grundy value $0$, because every move from it leaves a heap of size $2$ or $3$, and both of those have Grundy value $1$. The size $5$ suggests a large pile; the Grundy value says the pile is harmless.

A third baseline is the memoized recursion on one heap. It computes the Grundy values correctly, in $O(M k)$ time once each size is visited once, but it recurses to depth $M$. At $M = 10^5$ that depth is a problem in Python and in the default Java stack. The iterative table in the algorithm section removes the recursion and is no harder to write.

## Key insight

The insight has two halves, and the proof of the second half is the theorem that gives the technique its name.

**First half: one number suffices.** For a single position, the set of positions reachable in one move determines everything. Call a position losing when the player to move loses, and winning otherwise. Then a position is losing exactly when every move leads to a winning position, and winning exactly when some move leads to a losing position. The Grundy value restates this boolean as a number: $g = 0$ if and only if the position is losing, and the mex construction assigns distinct numbers to positions whose option sets differ in the way that matters.

**Second half: XOR combines independent components.** Consider a position that is a sum $G + H$, where a move changes exactly one of $G$ and $H$. Claim that its Grundy value is $g(G) \oplus g(H)$. The claim follows from the defining property of mex: the value $s = g(G) \oplus g(H)$ must not be reachable in one move, and every value below $s$ must be reachable in one move. Both are true, and the argument is in the formal model.

The practical consequence is that the tuple of heaps never has to be enumerated. Each heap is solved on its own, the answers are XORed, and a zero XOR means the second player wins.

The detail that makes the second half work is that a move in one component changes that component's Grundy value to a **different** value. The mex definition guarantees this: if $g(v) = a$, then no option of $v$ has value $a$, because $a$ was excluded. That single fact is what prevents a move from preserving the XOR.

## Visual intuition

Take the allowed amounts $\{2, 3\}$ and tabulate the Grundy value of a single heap.

| $s$ | Legal moves          | Values of the options | $g(s)$ |
| --- | -------------------- | --------------------- | ------ |
| 0   | none                 | empty set             | 0      |
| 1   | none                 | empty set             | 0      |
| 2   | $2 \to 0$            | $\{0\}$               | 1      |
| 3   | $2 \to 1$, $3 \to 0$ | $\{0\}$               | 1      |
| 4   | $2 \to 2$, $3 \to 1$ | $\{1, 0\}$            | 2      |
| 5   | $2 \to 3$, $3 \to 2$ | $\{1\}$               | 0      |
| 6   | $2 \to 4$, $3 \to 3$ | $\{2, 1\}$            | 0      |
| 7   | $2 \to 5$, $3 \to 4$ | $\{0, 2\}$            | 1      |
| 8   | $2 \to 6$, $3 \to 5$ | $\{0\}$               | 1      |
| 9   | $2 \to 7$, $3 \to 6$ | $\{1, 0\}$            | 2      |
| 10  | $2 \to 8$, $3 \to 7$ | $\{1\}$               | 0      |

The column of option values is the whole computation. The mex of $\{1, 0\}$ is $2$, the mex of $\{1\}$ is $0$, and the mex of the empty set is $0$. The table repeats with period $5$ from $s = 0$: $0, 0, 1, 1, 2$ and then the same five values again. A period is common in subtraction games and is worth noticing, because it can turn a table into a formula.

Row $s = 5$ is the important one. The heap is non-empty and the player to move has two legal moves, yet the Grundy value is $0$: the position is losing. A picture of the heap shows five stones; a picture of the game shows a dead end. The Grundy value is a picture of the game.

Now put three heaps of sizes $4$, $5$ and $6$ on the table. Their values are $2$, $0$ and $0$, and

$$
2 \oplus 0 \oplus 0 = 2 \ne 0,
$$

so the first player wins. The winning move is the one that makes the XOR zero. From the heap of size $4$ the legal moves reach sizes $2$ and $1$, with values $1$ and $0$, so removing $3$ stones leaves a heap of value $0$. The new XOR is $0 \oplus 0 \oplus 0 = 0$, which is a losing position for the opponent.

## Formal model

A **finite impartial game** is a directed acyclic graph $G = (V, E)$ with a distinguished start vertex. The vertices are positions; $(v, u) \in E$ means that a player may move from $v$ to $u$. A vertex with no outgoing edge is **terminal**. Both players have the same moves from every vertex, which is what _impartial_ means, and the game is finite, so no play is infinite.

::: math definition Definition
The **Grundy value** (or **nimber**) of a vertex $v$ is

$$
g(v) = \operatorname{mex}\{ g(u) : (v, u) \in E \},
\qquad
\operatorname{mex}(S) = \min\{ n \ge 0 : n \notin S \}.
$$
:::

::: math definition Definition
The **disjunctive sum** $G + H$ of two games has positions $(v, w)$ with $v \in V(G)$ and $w \in V(H)$. Its moves are $(v, w) \to (v', w)$ for every move $v \to v'$ in $G$, and $(v, w) \to (v, w')$ for every move $w \to w'$ in $H$. A move changes exactly one component.
:::

::: math lemma Lemma
For every vertex $v$, the following two statements hold.

- No option of $v$ has Grundy value $g(v)$.
- For every $j$ with $0 \le j < g(v)$, some option of $v$ has Grundy value $j$.
:::

::: math proof Proof
Both are immediate from the definition. The mex of the option values is $g(v)$, so $g(v)$ is not one of them, which is the first statement. If some $j < g(v)$ were missing from the option values, then the mex would be at most $j$, contradicting $g(v) > j$. So every smaller value occurs, which is the second statement. $\square$
:::

::: math lemma Lemma
A vertex has $g(v) = 0$ if and only if the player to move from $v$ loses under optimal play.
:::

::: math proof Proof
Induct on the game graph, which is acyclic. A terminal vertex has no options, so its mex is $0$, and the player to move loses, which matches.

For a non-terminal $v$: $g(v) = 0$ exactly when $0$ is absent from the option values, that is, when every option has a nonzero Grundy value. By the induction hypothesis, every option is then a winning position for the player who moves next, so every move from $v$ hands the opponent a win and $v$ is losing. Conversely, $g(v) \ne 0$ exactly when some option has value $0$, which by induction is a losing position for the opponent, so $v$ is winning. $\square$
:::

::: math theorem Theorem (Sprague-Grundy)
For games $G$ and $H$,

$$
g(G + H) = g(G) \oplus g(H).
$$
:::

::: math proof Proof
Let $a = g(G)$, $b = g(H)$, and $s = a \oplus b$. It is enough to show that the number $s$ satisfies the two mex properties for the vertex $(v, w)$, because the Grundy value is the unique number that does.

**No option has value $s$.** A move in $G$ replaces $a$ by some $a' \ne a$ and leaves $b$ alone, so the new value is $a' \oplus b$. If it equaled $a \oplus b$, then XORing both sides with $b$ would give $a' = a$, a contradiction. The same argument applies to a move in $H$.

**Every $t < s$ is reachable.** Let $d = s \oplus t$, and let $p$ be the highest bit at which $s$ and $t$ differ. Because $t < s$, bit $p$ of $s$ is $1$ and bit $p$ of $t$ is $0$, and $d$ has bit $p$ set and every higher bit zero. Since $s = a \oplus b$ has bit $p$ set, exactly one of $a$ and $b$ has bit $p$ set; say it is $a$. Set $a' = a \oplus d$. Above bit $p$, $a$ and $a'$ agree, and at bit $p$ the value $a'$ has $0$ where $a$ has $1$, so $a' < a$. By the lemma, some option of $G$ has Grundy value $a'$. Moving there gives the value $a' \oplus b = a \oplus d \oplus b = s \oplus d = t$. $\square$
:::

::: math corollary Corollary
The first player wins the sum $G_1 + \cdots + G_n$ if and only if

$$
g(G_1) \oplus \cdots \oplus g(G_n) \ne 0.
$$
:::

The corollary is the algorithm. The theorem is the license to compute each component in isolation.

## Algorithm derivation

The algorithm has two stages: tabulate one component, then combine the components with XOR.

**Stage 1: tabulate a heap game.** Suppose every position is a heap size, and the legal moves from size $s$ are the sizes $s - m$ for $m$ in the allowed set $A$ with $m \le s$. Let $M$ be the largest heap in the input.

1. Create an array `grundy` of $M + 1$ integers and set `grundy[0] = 0`.
2. For $s$ from $1$ to $M$: collect the values `grundy[s - m]` over every legal $m$, and set `grundy[s]` to their mex.
3. A heap of size $s$ that is smaller than every allowed move has no options, so its value is $0$.

The mex is computed with a marker array and a timestamp, so the marker array is never cleared:

```cpp
std::vector<int> grundy(maxHeap + 1, 0);
std::vector<int> seen(k + 2, 0);
for (int s = 1; s <= maxHeap; ++s) {
    for (int m : moves) {
        if (m <= s) seen[grundy[s - m]] = s;   // stamp s marks a reachable value
    }
    int g = 0;
    while (g <= k && seen[g] == s) ++g;
    grundy[s] = g;
}
```

The stamp is the heap size itself, which is unique to the iteration, so a stale marker from an earlier size is ignored. The loop over $g$ stops after at most $k + 1$ steps, because at most $k$ distinct values were marked; with duplicate move sizes even fewer are.

**Stage 2: combine.** For each heap size $s_i$ in the input, read `grundy[s_i]` and XOR it into a running total. Print the value of each heap, then print whether the total is nonzero.

```cpp
int total = 0;
for (int s : heaps) {
    std::cout << grundy[s] << '\n';
    total ^= grundy[s];
}
std::cout << (total != 0 ? "first" : "second") << '\n';
```

**Stage 1 for a splitting game.** When a move replaces one heap by several, the value of the move is the XOR of the values of the new heaps, and the mex is taken over those XORs:

$$
g(n) = \operatorname{mex}\Bigl\{ g(a_1) \oplus \cdots \oplus g(a_k) : (a_1, \ldots, a_k) \text{ is a legal split of } n \Bigr\}.
$$

The split parts are smaller than $n$, so they are already tabulated when $n$ is processed, and the same increasing loop works. Only the inner loop changes.

## Step-by-step execution

Run the allowed amounts $\{2, 3\}$ on the heaps $4$, $5$ and $6$.

**Tabulation.**

| $s$ | Options $s - m$ | Their values | Set of values | $g(s)$ |
| --- | --------------- | ------------ | ------------- | ------ |
| 0   | none            | none         | empty         | 0      |
| 1   | none            | none         | empty         | 0      |
| 2   | 0               | 0            | $\{0\}$       | 1      |
| 3   | 1, 0            | 0, 0         | $\{0\}$       | 1      |
| 4   | 2, 1            | 1, 0         | $\{1, 0\}$    | 2      |
| 5   | 3, 2            | 1, 1         | $\{1\}$       | 0      |
| 6   | 4, 3            | 2, 1         | $\{2, 1\}$    | 0      |

**Combination.**

| Heap | $g$ | Running XOR |
| ---- | --- | ----------- |
| 4    | 2   | 2           |
| 5    | 0   | 2           |
| 6    | 0   | 2           |

The final XOR is $2 \ne 0$, so the first player wins.

**The winning move.** From heap $4$, removing $3$ leaves heap $1$. Its value is $0$, so the new XOR is $0 \oplus 0 \oplus 0 = 0$, a losing position for the opponent. Removing $2$ instead leaves heap $2$ with value $1$, and the XOR becomes $1 \oplus 0 \oplus 0 = 1$, which hands the opponent a win.

**A second position, for contrast.** Take heaps $5$ and $6$ alone. Both have value $0$, so the XOR is $0$ and the first player loses. Every move from either heap leaves a heap of size $2$ or $3$, whose value is $1$, and the opponent answers by emptying that heap; the first player is left with a heap below the smallest allowed move.

The trace also shows why the sizes are not the values. The heap of size $5$ is larger than the heap of size $2$, yet its value is smaller: $0$ against $1$. Ordering by size says nothing about the game.

## Correctness proof

::: math theorem Theorem
The tabulation and the XOR combination return the correct winner for every position.

:::

::: math proof Proof
The tabulation is well founded because every legal move from size $s$ goes to a size $s - m < s$, so the value of every option is known when $s$ is processed. The computed value is the mex of exactly the option values, which is the definition of the Grundy value, so `grundy[s] = g(s)` for every $s \le M$.

The combination is the corollary of the Sprague-Grundy theorem. Each heap is an independent component of the disjunctive sum, because a move changes exactly one heap. The theorem gives

$$
g(\text{whole position}) = \bigoplus_i g(\text{heap}_i),
$$

and the lemma gives that the whole position is losing exactly when this value is $0$. The program prints `first` precisely when the value is nonzero, which is the winning condition. $\square$
:::

Two details of the tabulation are worth stating as lemmas, because they are where implementations usually go wrong.

::: math lemma Lemma
The mex of the option values is at most the number of allowed moves.
:::

::: math proof Proof
The mex of a set of $k$ values is at most $k$, because among $0, 1, \ldots, k$ at most $k$ can be present. The option set has at most one value per allowed move, so it has at most $k$ elements. $\square$
:::

The lemma bounds the marker array: the mex never exceeds $k$, so `seen` needs indices $0$ through $k$, plus one slot for the loop guard.

::: math lemma Lemma
A heap smaller than every allowed move has Grundy value $0$.
:::

::: math proof Proof
It has no legal move, so its option set is empty and its mex is $0$. $\square$
:::

This is the case that the "size equals value" guess gets wrong most visibly: a heap of size $2$ with allowed moves $\{3, 4\}$ is already a loss for the player to move.

## Complexity analysis

| Method | Time | Space |
| --- | --- | --- |
| Win-and-loss search over configurations | Exponential in the number of heaps | $O(\text{heaps})$ |
| One-heap memoized recursion | $O(M k)$ | $O(M)$ plus recursion depth $M$ |
| One-heap iterative table | $O(M k)$ | $O(M + k)$ |
| Table plus XOR of the input heaps | $O(M k + h)$ | $O(M + k)$ |

**Tabulation.** Each size $s$ is processed once and scans the $k$ allowed moves. The mex loop runs at most $k + 1$ times by the bound above. So the table costs $O(M k)$ time.

**Combination.** One array lookup and one XOR per heap, so $O(h)$.

**Memory.** The table has $M + 1$ entries, the marker array has $k + 2$ entries, and the move list has $k$ entries. The heaps can be processed as they are read, so they need not be stored; if the output requires every value before the summary line, they are stored or the two passes are folded into one.

At $M = 10^5$, $k = 100$ and $h = 10^5$, the table costs about $10^7$ simple operations, which is comfortable in every language in this encyclopedia. The exponential baseline at ten heaps of size twenty and two moves costs about $21^{10} \approx 1.7 \times 10^{13}$ configurations, which is not.

The bound also explains when the technique is not worth it. If there is only one heap, the table is still the right way to compute its value, but there is no XOR to perform and no batching to exploit. If the move set is "remove any positive number", the value is the size itself and the table is unnecessary: the answer is the XOR of the heap sizes.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Several independent heaps, remove any amount | Ordinary Nim: XOR the sizes |
| Several independent heaps, a fixed move set | Sprague-Grundy: tabulate, then XOR |
| One heap with a fixed move set | The same tabulation, with no XOR |
| A move splits a heap into several | Sprague-Grundy, XOR inside the mex |
| The player who cannot move wins | Misère play, a separate analysis |
| The players have different move sets | A partizan game, outside this theory |
| The game can return to a previous position | A draw analysis on the game graph |
| The question asks for a move count | A different DP; the Grundy value is not a distance |
| The question asks for the number of winning strategies | A counting DP over the game graph |
| The game is a sum of games on a graph, not heaps | Tabulate the graph vertices, then XOR the components |

The last row is the generalization that matters. Nothing in the theorem requires the components to be heaps. Any finite impartial game can be summarized, including a game played on the vertices of a directed acyclic graph, a game on a grid, or a game on a tree. The tabulation order is a topological order of the game graph, which for heap games is simply increasing size.

The misère row is the one to treat with respect. Misère Nim has a closed form, but misère versions of other games usually do not, and the XOR rule is simply false there. A statement that says "the player who takes the last stone loses" is not a Sprague-Grundy problem unless it is Nim or a known reduction.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $k$, the number of allowed move sizes.
2. Read $k$ positive integers, the allowed amounts.
3. Read $h$, the number of heaps.
4. Read $h$ non-negative integers, the heap sizes.
5. Print the Grundy value of each heap on its own line, in input order.
6. Print `first` when the XOR of the values is nonzero, and `second` otherwise.

The input is whitespace-separated, so line breaks may appear anywhere between two numbers. The move amounts need not be sorted or distinct, and an amount larger than every heap is legal input that simply never applies. A heap of size $0$ is legal and has value $0$.

All six variants build the same table with the same stamp trick, so they produce byte-identical output on the shared fixtures. The C and C++ variants store the table in `int`; Java uses `int`; Python uses its arbitrary-precision integers, which cost nothing here because the values are at most $k$; Pascal uses `LongInt`; JavaScript uses `Number`. The XOR result fits in a 32-bit integer whenever the number of moves does, because every Grundy value is at most the number of moves.

The C variant allocates the three arrays with `malloc` and frees them before returning, including on the early-exit paths. The C++ variant uses `std::vector`. The Java variant reads tokens with a `StringTokenizer` over a buffered reader and collects the output in a `StringBuilder`. The Python variant reads the whole input once and splits it, which keeps the parsing loop out of the interpreter's per-token overhead. The Pascal variant gives every `Read` exactly one argument, uses `SysUtils` for `IntToStr`, and avoids `IOResult`, so it compiles under the browser build of the compiler. The JavaScript variant reads standard input as one string and splits it.

The manifest publishes only the `program` variant. The reusable core is three loops, and a class would hide the two decisions that matter: where the table ends and where the XOR starts.

## Recursion decision

The Grundy value is defined recursively, and a memoized recursion computes it correctly:

```cpp
int grundy(int s) {
    if (memo[s] != -1) return memo[s];
    std::vector<bool> seen(k + 2, false);
    for (int m : moves) {
        if (m <= s) seen[grundy(s - m)] = true;
    }
    int g = 0;
    while (seen[g]) ++g;
    return memo[s] = g;
}
```

The recursion depth is the largest heap size, because each call reduces the size by at least $1$. That is harmless for small heaps and fatal for large ones in languages with a shallow stack. The iterative loop is not an optimization of the recursion; it is the same recurrence with the evaluation order made explicit.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | The loop; recursion is safe only for small heaps |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loop |
| Python | Interpreter limit of 1000 | 1000 frames | The loop, or raise the limit explicitly |
| Pascal | The operating system stack | Depends on the platform | The loop |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loop |

There is a second recursion to avoid. A win-and-loss search over the whole configuration recurses over tuples of heaps, and its depth is the number of moves in the game, which can be the total number of stones. The Grundy table replaces that search rather than optimizing it. If a problem really does need the search, because the game is partizan or misère, then the state must be compressed some other way.

The general rule: **the recursion depth of a game DP should be the size of one component, not the size of the whole position.** If it is the latter, either the components are not being separated or the game is not a sum.

## Implementation walkthrough

Five details decide whether a Grundy program is correct.

**The mex is over values, not over positions.** The option set contains `grundy[s - m]`, not `s - m`. With allowed moves $\{2\}$ and heap $3$, the only option is heap $1$ with value $0$, so the mex is $1$; the mex of the option _sizes_ $\{1\}$ would be $0$. The two answers differ, and the second one calls a winning heap a loss.

```cpp
seen[grundy[s - m]] = s;   // right
// seen[s - m] = s;        // wrong: this is the mex of the sizes
```

**The stamp removes the clearing cost.** A fresh boolean array per size would make the tabulation $O(M k)$ anyway, but the constant is larger and the allocation pattern is worse. The stamp is the current size, which is never reused, so an entry is live exactly when `seen[value] == s`.

**Moves larger than the heap are skipped, not treated as zero.** A move of $5$ stones from a heap of $3$ is not a move to a heap of $-2$; it is not a move at all. The guard `if (m <= s)` is the whole difference between a correct table and an out-of-bounds read.

**A heap of size $0$ is a position, not an absence.** It has no moves, so its value is $0$, and it contributes nothing to the XOR. Reading $h$ heaps and printing $h$ values includes it.

**The summary line is a separate decision from the per-heap lines.** Compute the XOR while printing the values, and print the winner after the loop. Printing the winner early and the values later is a common way to get the order wrong in the output.

A compact Python core is:

```python
grundy = [0] * (max_heap + 1)
seen = [0] * (len(moves) + 2)
for s in range(1, max_heap + 1):
    for m in moves:
        if m <= s:
            seen[grundy[s - m]] = s
    g = 0
    while g <= len(moves) and seen[g] == s:
        g += 1
    grundy[s] = g

total = 0
for s in heaps:
    print(grundy[s])
    total ^= grundy[s]
print("first" if total else "second")
```

The table and the combination are independent. A wrong table gives wrong values on every heap; a wrong combination gives the right values and the wrong winner. Print both while testing, because the fixtures show which half failed.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Taking the mex of the option sizes | Heap values are wrong, usually too small | Take the mex of `grundy[s - m]` |
| Assuming the value equals the heap size | Gapped move sets are misjudged | Tabulate unless every removal amount is allowed |
| Forgetting the guard `m <= s` | Negative indices or a wrong option set | Skip moves larger than the heap |
| Clearing the marker array incorrectly | Stale marks make the mex too large | Use the current size as a stamp |
| XORing sizes instead of values | The winner is wrong from the first gapped move set | XOR `grundy[s]` |
| Treating a zero heap as not present | The per-heap output loses a line | Print one value per heap, including zero |
| Forbidden to use a move twice, globally | The components are no longer independent | The restriction must be scoped to one heap |
| Applying XOR to a misère game | The winner is wrong on the last move | Read the losing condition before choosing the theory |

### Why this fails: XOR of the heap sizes

The plausible wrong approach is to keep the Nim rule and apply it to a game that is not Nim. "The answer is the XOR of the heap sizes" is memorable, it is correct for the most famous impartial game, and it is wrong as soon as the move set has a gap.

The smallest counterexample is the allowed amounts $\{2, 3\}$ with heaps $2$ and $3$. The true values are $g(2) = \operatorname{mex}\{g(0)\} = 1$ and $g(3) = \operatorname{mex}\{g(1), g(0)\} = \operatorname{mex}\{0, 0\} = 1$. The XOR is $1 \oplus 1 = 0$, so the first player loses.

Play it out. From heaps $(2, 3)$ the first player has three legal moves:

- remove $2$ from heap $2$, leaving $(0, 3)$; the opponent removes $3$ and wins;
- remove $2$ from heap $3$, leaving $(2, 1)$; the opponent removes $2$ from the first heap, leaving $(0, 1)$, and the first player has no move;
- remove $3$ from heap $3$, leaving $(2, 0)$; the opponent removes $2$ and wins.

Removing $3$ from the heap of size $2$ is not a legal move, so there is nothing else to try.

Every move loses, which confirms the Grundy verdict. The size XOR is $2 \oplus 3 = 1 \ne 0$, so the size-based program announces a first-player win. The program is wrong on the smallest position where the move set skips a value.

A second failure is subtler and lives inside the tabulation. The mex must be taken over the values of the options, and the smallest counterexample is the allowed amount $\{2\}$ with heap $3$. The only option is heap $1$, whose value is $0$, so $g(3) = 1$: a heap of three stones is a win. The program that takes the mex of the option sizes computes $\operatorname{mex}\{1\} = 0$ and calls the same heap a loss. The mistake is not an off-by-one; it confuses the identity of a position with its game value.

A third failure is the missing `m <= s` guard, which in a language with wrapping arithmetic produces a large positive index and a wrong value instead of a crash. The bug is silent on the heaps that are large enough and wrong exactly on the small ones, which the large fixtures never test.

The lesson generalizes: **the Grundy value is not a measure of size, and the mex is not a measure of positions.** Both substitutions feel natural, both are wrong, and both survive every test that only uses Nim-like move sets.

## Variants and extensions

- **Ordinary Nim.** The move set is every positive amount, so $g(s) = s$ and the winner is decided by the XOR of the sizes. This is Bouton's theorem, the special case that gave the technique its name.
- **Misère Nim.** The player who takes the last stone loses. While at least two heaps hold more than one stone, play normal Nim; when exactly one such heap remains, leave an odd number of heaps of size one; when every heap has size one, the player to move wins exactly when the number of heaps is even. The XOR rule does not apply.
- **Subtraction games with a period.** Many move sets produce an eventually periodic Grundy sequence. Detecting the period turns the table into $O(1)$ time per query and allows heap sizes far beyond the tabulation limit.
- **Splitting games.** A move replaces one heap by several, and the value of the move is the XOR of the parts. Dawson's Kayles, Treblecross, and the arithmetic-progression split of the first worked problem are examples.
- **Octal games.** A compact notation for games whose moves remove a prefix and optionally split the remainder. The Grundy sequences of many octal games are eventually periodic, and computing the period is a research problem for some of them.
- **Games on a graph.** The vertices are positions and the edges are moves. The table is a dynamic program in topological order, and a sum of such games is again an XOR. If the graph has a cycle, a position may be a draw, and the theory needs a three-valued analysis instead of a mex.
- **Green Hackenbush.** A graph of edges rooted at the ground; cutting an edge removes everything no longer connected. Trees are equivalent to Nim heaps, and the general graph is solved with the colon principle.
- **Moore's Nim.** A move may change up to $k$ heaps. The position is no longer a disjunctive sum, so the XOR rule fails and a different characterization is needed. It is a useful reminder that independence, not turn-taking, is the hypothesis.
- **Partizan games.** The players have different move sets. The summary is a surreal number or a game value, the arithmetic is not XOR, and the theory is outside this article.
- **Win or loss without XOR.** With a single component, the mex table can be replaced by a boolean table of wins and losses. The exact values are needed only when components are combined, because the XOR is sensitive to them.

## Contest strategy

1. Decide that the game is impartial, finite, and normal play. If any of the three fails, stop and look for the matching theory.
2. Decide what one component is. For a heap game it is a heap; for a board it is the board; for a sum of subgames created by a split, it is each new part.
3. Write the mex recurrence for one component, including the guard for moves that are too large.
4. Tabulate in increasing order of the state, which for heap games is the size and for graph games is a topological order.
5. Check the tabulation on a small case by hand, and compare it with the win-and-loss search on tiny inputs. The two must agree.
6. Compute the XOR of the components, print it if the statement asks for the value, and test it against zero for the winner.
7. Check the edge cases: heap $0$, a heap below the smallest move, a move larger than every heap, duplicate move amounts, and a single heap.

Two strategic notes. First, a period in the Grundy sequence is worth looking for: tabulate a few hundred values, find the repeat, and prove it if the constraints need it. Second, if the statement asks for the winning move rather than the winner, the Grundy values give it directly: find a component whose value can be changed to make the total XOR zero.

## Worked problems

### Problem 1: Industrial Nim

**Restatement.** There are $n$ quarries. Quarry $i$ has $m_i$ dumpers, holding $x_i, x_i + 1, \ldots, x_i + m_i - 1$ stones. A move removes any positive number of stones from one dumper. The player who cannot move loses. Print `tolik` if the first player wins and `bolik` otherwise. Constraints: $n \le 10^5$ and $x_i, m_i \le 10^{16}$.

**Naive baseline.** The dumpers are Nim heaps, so the answer is the XOR of all their sizes, but a quarry can contain $10^{16}$ of them. XORing them one by one is impossible.

**Insight.** The XOR of the consecutive range $[x, x + m - 1]$ is the XOR of the prefix $[0, x + m - 1]$ XORed with the prefix $[0, x - 1]$, and the prefix XOR has a period of four.

**Derivation.** Define $F(t) = 0 \oplus 1 \oplus \cdots \oplus t$. Then $F(t)$ is $t$ when $t \equiv 0 \pmod{4}$, $1$ when $t \equiv 1$, $t + 1$ when $t \equiv 2$, and $0$ when $t \equiv 3$. The range XOR is $F(x + m - 1) \oplus F(x - 1)$, with $F(-1) = 0$. XOR the range values over all quarries and print the winner.

**Correctness.** A dumper is an ordinary Nim heap, so its Grundy value is its size, and the sum of all dumpers is a disjunctive sum. The XOR of the sizes is therefore the Grundy value of the whole position, and the first player wins exactly when it is nonzero. The prefix formula is a four-case identity, verified directly for each residue.

**Complexity.** $O(n)$ time and $O(1)$ space.

**Common wrong approach.** Computing the XOR by looping over the dumpers, which is $O(\sum m_i)$ and can be $10^{21}$ operations. The second wrong approach is a prefix formula with the residue cases off by one, which is right on the sample and wrong on a range of length one.

### Problem 2: Interesting Game

**Restatement.** One pile of $n$ stones. A move takes one pile and divides it into $k \ge 2$ piles of sizes $a_1 > a_2 > \cdots > a_k > 0$ with $a_1 - a_2 = a_2 - a_3 = \cdots = a_{k-1} - a_k = 1$. The player who cannot move loses. If the first player wins, print the smallest $k$ of a winning first move; otherwise print $-1$. Constraints: $n \le 10^5$.

**Naive baseline.** Search the game tree. Each position is a multiset of piles, and a move replaces one pile by several, so the number of positions is the number of partitions of $n$, which is exponential.

**Insight.** A move splits one component into several independent components, so the value of the resulting position is the XOR of the values of the new piles. The value of a single pile of size $s$ can be tabulated in increasing $s$.

**Derivation.** For each $s$, enumerate every arithmetic progression of length $k \ge 2$ with difference $1$ and sum $s$: choose $k$, then the largest part is

$$
a = \frac{2s + k(k-1)}{2k},
$$

which must be an integer at least $k$. The option value is the XOR of the tabulated values of $a, a - 1, \ldots, a - k + 1$. Set $g(s)$ to the mex of those values. After the table, if $g(n) = 0$ print $-1$. Otherwise enumerate the splits of $n$ again and print the smallest $k$ whose option value is $0$.

**Correctness.** The split creates independent components, so the Sprague-Grundy theorem gives the XOR of their values, and the mex over all splits is the definition of $g(s)$. The first player wins exactly when $g(n) \ne 0$. A first move wins exactly when it leaves value $0$, so the smallest such $k$ is the answer.

**Complexity.** $O(n \sqrt{n})$ time to enumerate the splits, since a split of length $k$ has sum at least $k(k+1)/2$, so $k = O(\sqrt{n})$, and $O(n)$ space.

**Common wrong approach.** XORing the sizes of the new piles instead of their Grundy values. The sizes are positive and large; the values are small and periodic, and the two disagree on the first pile whose value is not its size.

### Problem 3: Game of Stones

**Restatement.** There are $n$ piles of stones. A move removes some positive number of stones from one pile, and **no removal amount may be used twice on the same pile**. The player who cannot move loses. Sam moves first; print `YES` if Jon wins and `NO` otherwise. Constraints: $n \le 10^6$ and every pile size is at most $60$.

**Naive baseline.** Tabulate the Grundy value with the set of already-used amounts as part of the state. The state is a size and a bitmask of used amounts, which is $O(60 \cdot 2^{60})$ states, far too many.

**Insight.** The value of a pile of size $s$ with every removal amount available is the largest $k$ with $k(k+1)/2 \le s$.

**Derivation.** Let $k(s)$ be that largest $k$. Compute it directly, or tabulate it for every size up to the maximum in the input. XOR the values of the piles; Jon wins exactly when the XOR is zero, because Sam moves first.

**Correctness.** By the mex property, a position of value $v$ has a chain of options with values $v - 1, v - 2, \ldots, 0$. The amounts removed along that chain are distinct, because the rule forbids reusing an amount on the same pile, so their sum is at least $1 + 2 + \cdots + v$. That sum is at most $s$, which gives $v \le k(s)$. The matching lower bound is the standard induction on $s$: the options of the full-move position realize every value below $k(s)$, so the mex is $k(s)$. The piles are independent because a forbidden amount is recorded per pile, so the XOR rule decides the sum.

**Complexity.** $O(n)$ time after a precomputed table of $k(s)$ for $s \le 60$, and $O(1)$ extra space.

**Common wrong approach.** Printing `YES` when the XOR is nonzero. Sam moves first, so Jon wins exactly when the starting position is a loss for the player to move, which is the zero XOR.

## Practice progression

1. **Recognition.** Given a statement, decide whether the game is impartial, finite, and normal play, and identify one component. Reject partizan, misère, and cyclic games explicitly.
2. **Direct application.** Implement the win-and-loss search for a subtraction game with small heaps, then implement the Grundy table and check that the two agree on every position up to size $12$.
3. **Adaptation.** Add a second heap and check that the XOR of the tabulated values agrees with the search over pairs of heaps. This is the step where the theorem becomes believable.
4. **Combination.** Solve a splitting game, where the move value is the XOR of the parts, and compare the table against a brute-force search on small instances.
5. **Challenge.** Find and prove the period of a subtraction game, then answer heap sizes far beyond the tabulated range with the period.
6. **Transfer.** Apply the same table to a game on a graph, a game on a grid, or a game whose state is a bitmask, and confirm that independence, not the heap shape, is the requirement.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the mex of a set compute, and what is the mex of the empty set? (At a glance)
2. Why does a position with Grundy value zero lose? (Formal model)
3. State the two properties of the option values that the mex definition guarantees. (Formal model)
4. Prove that a move in one component cannot preserve the XOR of the components. (Formal model)
5. Why is the mex at most the number of allowed moves? (Correctness proof)
6. What is the Grundy value of a heap smaller than every allowed move, and why? (Correctness proof)
7. What is the cost of the table, and how much of it is the mex loop? (Complexity analysis)
8. What is the smallest position on which the XOR of the sizes disagrees with the XOR of the values, and what does each report? (Common mistakes)
9. Why is the mex taken over the option values rather than the option sizes, and what is the smallest counterexample? (Common mistakes)
10. Why does the third worked problem print `YES` on a zero XOR? (Worked problems)

## Further reading

- The recursion that the table replaces is [recursion](/algorithms/foundations/recursion), which covers the call-stack limits that decide between the memoized and iterative forms.
- The dynamic program over game states is a [DAG dynamic program](/algorithms/dynamic-programming/dag-dp) when the states are positions and the edges are moves.
- When the state of a game includes a small set of used moves, the state is a [bitmask](/algorithms/dynamic-programming/bitmask-dp), and the size of that state space is the reason the closed form in the third worked problem matters.
- XOR is the addition of the [binary representation](/algorithms/foundations/binary-representation), which is the operation the whole combination rule is built on.
- The other subject technique that reduces a game to linear algebra is [XOR bases](/algorithms/advanced/xor-bases); its maximum-XOR greedy is a different use of the same bit operation.
- The subject index lists this technique beside the offline and algebraic techniques in [the advanced algorithms](/algorithms/advanced/), including [parallel binary search](/algorithms/advanced/parallel-binary-search).
- The search over game trees that the table replaces, when it cannot be replaced, is [backtracking](/algorithms/enumeration/backtracking), and its exhaustive form is [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The counting version of a game, where the question is how many play sequences exist rather than who wins, is a [counting dynamic program](/algorithms/combinatorics/counting-dp).
- The graph traversal that gives the topological order for a game on a general graph is [depth-first search](/algorithms/graphs/dfs).
- The arithmetic of the periods and congruences that a periodic Grundy sequence is proved with is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The complexity vocabulary used throughout the cost table is in [complexity analysis](/algorithms/foundations/complexity).
