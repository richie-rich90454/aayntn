---
id: advanced.bitset-optimization
title: Bitset optimization
summary: Store the reachable sums of a dynamic program in machine words, so adding one weight shifts the whole set a word of sums at a time.
division: [platinum]
subjects: [advanced]
level: advanced
importance: advanced-technique
keywords:
    [bitset, word-level parallelism, subset sum, reachability, shift and or, bit vector, knapsack]
prerequisites:
    required: [foundations.binary-representation, foundations.complexity]
    recommended:
        [
            dynamic-programming.0-1-knapsack,
            enumeration.subset-enumeration,
            enumeration.meet-in-the-middle,
        ]
complexity:
    time: "O(nW / 32)"
    space: "O(W / 32)"
assumptions:
    - Every weight is a positive integer, so a partial sum above the limit can never come back down and may be discarded.
    - The limit W is at most 100000 and the number of weights is at most 2000, so the whole bit vector fits in memory.
implementations: advanced.bitset-optimization
reviewed: false
---

## At a glance

Bitset optimization replaces a loop over a set of small integers with a few instructions that act on a machine word at a time. The set is stored as a bit vector: bit $s$ is one exactly when $s$ is in the set. One word holds 32 or 64 consecutive values, so one shift moves a whole block of candidates.

The canonical application is subset-sum reachability. If $B$ is the bit vector of the sums reachable with the items seen so far, then adding an item of weight $w$ is

$$
B \leftarrow B \lor (B \ll w),
$$

followed by dropping the bits above the limit $W$. The shift moves every reachable sum up by $w$, and the OR keeps the sums that do not use the new item. Both operations run on words, so one item costs about $W/32$ word operations instead of $W$ steps of a loop.

For $n$ items and a limit $W$ the total is $O(nW/32)$ time and $O(W/32)$ words of memory, against $O(nW)$ for the boolean table. The technique is not limited to subset sums: whenever the state of a dynamic program is a set of integers, the same shift-and-OR applies, and when the set lives in a graph or a string the same word parallelism applies with AND instead of OR.

## Problem motivation

A vault holds $n$ ingots with positive integer weights. An appraiser wants to know how many different totals can be placed on a scale whose beam is calibrated up to $W$ kilograms, counting the empty selection as the total $0$.

The direct dynamic program keeps a boolean table of size $W + 1$. For every ingot it walks the table downward and marks `reachable[s]` whenever `reachable[s - w]` is set. With $n = 2000$ and $W = 10^5$ that is $2 \ast 10^8$ table entries, each one a load, a branch, and sometimes a store. The program is correct, and it is close to the limit in C++ and well beyond it in Python.

The table is not really a table of independent values. It is a set of integers, and the transition is a translation of the whole set. The set needs one bit per value, not one byte, and all the bits of a machine word can be translated at once. That is the saving: the $2 \ast 10^8$ booleans become $6.25 \ast 10^6$ words, each one updated by two shifts, an OR, and a mask.

The limit $W$ is what makes the technique applicable. A bit vector has one bit per candidate sum, so it needs a bounded universe. It is the right tool when the universe is about $10^5$ or $10^6$ values and the number of items is in the thousands. When the limit grows to $10^9$ and the items are few, the same problem belongs to [meet in the middle](/algorithms/enumeration/meet-in-the-middle), because the bit vector would need 125 megabytes.

## Recognition patterns

Bitset optimization is the right tool when the statement contains some of these phrases.

- "How many different sums can be formed", "which totals are reachable", "the number of distinct subset sums".
- "The total weight is at most $10^5$", "the sum of the values is bounded", "the limit is small but the number of items is large".
- "Choose a subset of the items", with a sum, a weight, or a cost as the constraint.
- "Each item may be used at most once", which is the 0/1 form that the shift-and-OR reproduces.
- "The answer is the number of reachable states", which a population count supplies in one pass.
- "Two masks are combined with AND", in a problem about string matching or graph reachability.

The constraint values that rule the technique in and out:

| Situation | What it rules |
| --- | --- |
| $W \le 10^7$ and $n \ge 10^3$ | The bitset is the intended solution |
| $W \le 10^5$ and $n \le 20$ | [Subset enumeration](/algorithms/enumeration/subset-enumeration) is simpler |
| $W \ge 10^9$ and $n \le 40$ | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle), not a bit vector of a billion bits |
| The number of reachable sums is tiny | A list or a hash set is smaller and faster |
| The question asks how many subsets produce each sum | Bitsets store presence, not multiplicity |
| The items can be reused any number of times | The shift needs a doubling loop or a different recurrence |
| The subset has to be reconstructed | A pure bitset forgets which item set a bit |
| The values can be negative | A sum above $W$ can come back down, so discarding it is wrong |
| The limit changes per query | Allocate for the largest limit once and mask per query |

The counting row is the honest limit. A bit vector answers "is this sum reachable", and a population count turns that into "how many sums are reachable". It does not answer "how many subsets reach this sum", because the bits of a word are independent and carry no record of which items set them. That question belongs to a counting DP or to generating functions.

The last row is the practical extension. A program that answers many queries with different limits does not allocate a vector per query; it allocates the largest vector once and masks each query down to its own limit.

## Naive approach

The baseline is the boolean table, with the inner loop written downward so that each item is used at most once.

```cpp
std::vector<char> reachable(W + 1, 0);
reachable[0] = 1;
for (int w : weights) {
    for (int s = W; s >= w; --s) {
        if (reachable[s - w]) reachable[s] = 1;
    }
}
int answer = 0;
for (int s = 0; s <= W; ++s) answer += reachable[s];
```

The descending order is not a detail. In the ascending order the entry `reachable[s - w]` may already have been set by the same item, so the item would be used twice. The bitset version has the same obligation, expressed as a descending loop over words.

The cost is $O(nW)$ time and $O(W)$ bytes. At $n = 2000$ and $W = 10^5$ the inner loop runs $2 \ast 10^8$ times, and each iteration reads one byte, branches, and possibly writes one byte.

The second baseline is the standard library bitset, which is already the right idea:

```cpp
std::bitset<100001> reachable;
reachable[0] = 1;
for (int w : weights) {
    reachable |= reachable << w;
    // the bits above W are then masked away
}
```

That line is the whole transition. The six programs in this topic write it out by hand, because the technique has to be available in languages without a built-in bitset, and because the carry rule is the part that is easy to get wrong. A listing that hides the carry teaches nothing.

The third baseline is a list of reachable sums. It is excellent when the number of sums is small, because it touches only the sums that exist, but it degrades to a boolean table with a hash lookup on every entry when the sums become dense. The bitset is the predictable choice at the sizes this technique targets.

## Key insight

The insight is that **the set of reachable sums is the state, and adding an item is a translation of the whole set, which a word-level shift performs 32 sums at a time.**

Write the set of reachable sums after the first $k$ items as $R_k$. Then

$$
R_k = R_{k-1} \cup \{s + w_k : s \in R_{k-1},\ s + w_k \le W\}.
$$

The first part is "do not use item $k$", and the second part is "use item $k$" applied to every sum that already existed. Nothing else happens in the transition, so the state is exactly a set and the transition is exactly a translation.

A bit vector turns the translation into a shift. Bit $s$ of $B_{k-1}$ is one when $s \in R_{k-1}$, so bit $s + w_k$ of $B_{k-1} \ll w_k$ is one exactly when $s \in R_{k-1}$. The OR merges the two parts, and the mask removes the sums above $W$ that the shift pushed past the end.

The second insight is mechanical. A shift by $w$ is not a shift by a whole number of words. Write $w = 32q + r$ with $0 \le r < 32$. Then word $i$ of the result receives word $i - q$ shifted left by $r$, plus the top $r$ bits of word $i - q - 1$ shifted right by $32 - r$. That carry is the only place a hand-written version can go wrong.

The third insight is that the mask is safe. Weights are positive, so a sum above $W$ can only grow, and it can never return to the range that matters. Dropping it once is permanent, which is what lets the vector keep a fixed size.

## Visual intuition

Take the limit $W = 10$ and the weights $2$, $3$, and $5$. Write the bits from sum $0$ on the left to sum $10$ on the right; a one means the sum is reachable.

| Step       | Reachable sums             | Bit vector, sums $0$ to $10$ | Count |
| ---------- | -------------------------- | ---------------------------- | ----- |
| start      | $\{0\}$                    | `10000000000`                | 1     |
| weight $2$ | $\{0, 2\}$                 | `10100000000`                | 2     |
| weight $3$ | $\{0, 2, 3, 5\}$           | `10110100000`                | 4     |
| weight $5$ | $\{0, 2, 3, 5, 7, 8, 10\}$ | `10110101101`                | 7     |

The third row is the whole transition. The vector `10100000000` is kept, which is the "do not use $3$" part, and shifted left by three, which moves bits $0$ and $2$ to bits $3$ and $5$. The OR of the two is `10110100000`.

Now look at one step at the word level. Pretend a word holds eight bits so that the arithmetic is readable; the programs use 32. The limit is $W = 10$, so the vector has two words and the top word has three valid bits, for the sums $8$, $9$ and $10$. Start after the weights $2$ and $3$, so the reachable set is $\{0, 2, 3, 5\}$, and add the weight $7$.

| Word | Before | Shifted left by $7$ | Carry from the word below | After OR | After mask |
| --- | --- | --- | --- | --- | --- |
| word $0$, sums $0$ to $7$ | `00101101` | `10000000` | none, this is the bottom word | `10101101` | `10101101` |
| word $1$, sums $8$ to $15$ | `00000000` | `00000000` | `00101101 >> 1 = 00010110` | `00010110` | `00000110` |

The carry is the part that a per-sum loop does not have. Bit $5$ of word $0$ is the sum $5$; shifting it by $7$ would put it at sum $12$, which lives in word $1$ at bit $4$. The carry `00101101 >> 1` puts bit $5$ of word $0$ into bit $4$ of word $1$, and bit $2$ into bit $1$, which is the sum $9$. The mask then removes bit $4$, because the sum $12$ is above the limit.

The final vector is `10101101` followed by `00000110`, which is the set $\{0, 2, 3, 5, 7, 9, 10\}$, seven sums. The sums $0$, $2$ and $3$ were already there, the weight $7$ added $7$, $9$ and $10$, and the sum $12$ was dropped by the mask.

## Formal model

Let $B = 32$ be the word size and let $m = \lfloor W/B \rfloor + 1$ be the number of words needed for the sums $0$ through $W$.

::: math definition Definition
For a set $S \subseteq \{0, \ldots, W\}$ and an integer $w \ge 0$, the **translation** of $S$ by $w$ inside the universe is

$$
S + w = \{s + w : s \in S,\ s + w \le W\}.
$$
:::

::: math definition Definition
Let $w_1, \ldots, w_n$ be positive integers. The **reachable sets** are

$$
R_0 = \{0\}, \qquad R_k = R_{k-1} \cup (R_{k-1} + w_k) \quad (1 \le k \le n).
$$

The answer is $|R_n|$.
:::

::: math definition Definition
A **bit vector** of length $W + 1$ is a sequence of $m$ words $B[0], \ldots, B[m-1]$ of 32 bits, where bit $j$ of word $i$ represents the integer $32i + j$, and the bits above $W$ in the last word are always zero.
:::

::: math lemma Lemma
The shift of a bit vector by $w = 32q + r$, with $0 \le r < 32$, is computed by

$$
B'[i] = \bigl(B[i-q] \ll r\bigr) \ \lor\ \bigl(B[i-q-1] \gg (32-r)\bigr),
$$

where the second term is omitted when $r = 0$ or when $i - q - 1 < 0$.
:::

::: math proof Proof
Fix an output word $i$ and an output bit $j$ with $0 \le j < 32$. The output bit represents the integer $t = 32i + j$, and its source is the bit $t - w$ of the input. If $j \ge r$, then $t - w = 32(i-q) + (j-r)$, which is bit $j-r$ of word $i-q$; this is exactly the contribution of $B[i-q] \ll r$. If $j < r$, then $t - w = 32(i-q-1) + (32 + j - r)$, which is bit $32 + j - r$ of word $i-q-1$; since $32 - r \le 32 + j - r < 32$, this is exactly the contribution of $B[i-q-1] \gg (32-r)$. Bits with a negative source, and bits above $W$, are outside the vector and are discarded. $\square$
:::

::: math lemma Lemma
Masking the bits above $W$ is safe when every weight is positive.
:::

::: math proof Proof
A subset sum that exceeds $W$ stays above $W$ after any further positive weight is added, because the weights are positive. No sum at most $W$ can therefore be produced from a masked-out sum. $\square$
:::

::: math lemma Lemma
A weight $w > W$ leaves the reachable set unchanged.
:::

::: math proof Proof
Every subset that uses the weight has a sum of at least $w > W$, so it is outside the universe. Only the subsets that do not use it remain, and those are already counted. $\square$
:::

## Algorithm derivation

The algorithm is one pass over the weights and, inside it, one pass over the words.

1. Allocate $m = \lfloor W/32 \rfloor + 1$ words, clear them, and set bit $0$ of word $0$, which is the empty subset.
2. For each weight $w$, skip it when $w > W$ by the third lemma, and skip it when $w = 0$ because the translation changes nothing.
3. Split the weight into a word offset $q = \lfloor w/32 \rfloor$ and a bit offset $r = w \bmod 32$.
4. Walk the destination words from the top down to $q$, and for each one OR in the shifted word and its carry.
5. Mask the top word to the $W \bmod 32 + 1$ valid bits.
6. Count the set bits of every word and print the total.

```cpp
for (int i = words - 1; i >= word_shift; --i) {
    std::uint32_t moved = reachable[i - word_shift] << bit_shift;
    if (bit_shift > 0 && i - word_shift - 1 >= 0) {
        moved |= reachable[i - word_shift - 1] >> (32 - bit_shift);
    }
    reachable[i] |= moved;
}
if (top_bits < 32) {
    reachable[words - 1] &= (1u << top_bits) - 1u;
}
```

The descending order is what preserves the 0/1 rule. When $q \ge 1$, both source words are strictly below the destination word, so a descending walk reads a word before this weight writes it. When $q = 0$, the sources are word $i$ and word $i-1$; word $i-1$ is untouched because it comes later in the walk, and word $i$ itself is read into `moved` before the OR stores to it. An ascending walk would let word $i - q$ be updated earlier in the same weight and then read again, which uses the item twice.

The mask belongs inside the loop over weights, not only at the end. The invariant of the second lemma is that bits above $W$ are zero, and the proof of the first lemma reads that invariant. A program that masks only before counting gets the right answer for positive weights, because the stray bits only move upward, but it no longer implements the stated invariant, and the difference matters as soon as the vector is reused for a different query.

The population count is the last step, and it must use the word-level intrinsic. A loop over the 32 bits of every word costs back the factor the technique just won.

## Step-by-step execution

Five weights and a limit of $10$, the first fixture of this topic. The table lists the reachable set after each weight, and the count that the program prints at the end.

| Weight | New sums at most $10$                        | Reachable set                    | Count |
| ------ | -------------------------------------------- | -------------------------------- | ----- |
| start  | none                                         | $\{0\}$                          | 1     |
| $2$    | $2$                                          | $\{0, 2\}$                       | 2     |
| $3$    | $3, 5$                                       | $\{0, 2, 3, 5\}$                 | 4     |
| $5$    | $7, 8, 10$                                   | $\{0, 2, 3, 5, 7, 8, 10\}$       | 7     |
| $6$    | $6, 9$                                       | $\{0, 2, 3, 5, 6, 7, 8, 9, 10\}$ | 9     |
| $7$    | none, all of $7, 9, 10$ were already present | $\{0, 2, 3, 5, 6, 7, 8, 9, 10\}$ | 9     |

The weight $7$ shifts the old set to $7$, $9$, $10$, $12$, $13$, $14$, $15$, $16$ and $17$. The last six exceed the limit and disappear in the mask, and the first three were already reachable. The answer is $9$.

Now the same mechanics with a limit that spans three words, to see the word offsets and the carries. Let $W = 70$ and let the weights be $26$, $32$, $71$, $32$ and $6$. Then $m = 3$ words, and the top word has $70 \bmod 32 + 1 = 7$ valid bits, the sums $64$ through $70$. The words are written in hexadecimal.

| Weight | word $0$   | word $1$   | word $2$   | Reachable set                            | Count |
| ------ | ---------- | ---------- | ---------- | ---------------------------------------- | ----- |
| start  | `00000001` | `00000000` | `00000000` | $\{0\}$                                  | 1     |
| $26$   | `04000001` | `00000000` | `00000000` | $\{0, 26\}$                              | 2     |
| $32$   | `04000001` | `04000001` | `00000000` | $\{0, 26, 32, 58\}$                      | 4     |
| $71$   | `04000001` | `04000001` | `00000000` | unchanged, the weight is above the limit | 4     |
| $32$   | `04000001` | `04000001` | `00000001` | $\{0, 26, 32, 58, 64\}$                  | 5     |
| $6$    | `04000041` | `04000041` | `00000041` | $\{0, 6, 26, 32, 38, 58, 64, 70\}$       | 8     |

The weight $26$ is $q = 0$ and $r = 26$, so its shift stays inside word $0$. The first weight $32$ is $q = 1$ and $r = 0$, so each word is copied to the next word with no bit shift at all. The second weight $32$ reaches word $2$, where bit $26$ would be the sum $90$; the mask keeps only the low seven bits and turns that word into `00000001`, the sum $64$.

The weight $6$ is the interesting step. Word $0$ shifts by six inside itself and contributes `04000041`. Word $1$ receives the six-bit shift of word $0$ and the carry `04000001 >> 26 = 1`, which is bit $0$ of word $1$, the sum $26 + 6 = 32$. Word $2$ receives the six-bit shift of word $1$ and the carry `04000001 >> 26 = 1`, which is bit $0$ of word $2$, the sum $58 + 6 = 64$. The other carry contribution, bit $26$ of word $1$ shifted six places, would be bit $32$, which does not exist, and it falls out of the word.

The final words hold $3 + 3 + 2 = 8$ set bits, and the answer is $8$.

## Correctness proof

::: math theorem Theorem
After the last weight, the number of set bits of the bit vector is $|R_n|$.
:::

::: math proof Proof
Maintain the invariant that, before the weight $w_k$ is processed, bit $s$ of the vector is one exactly when $s \in R_{k-1}$, for every $0 \le s \le W$, and every bit above $W$ is zero.

The invariant holds at the start, because only bit $0$ is set and $R_0 = \{0\}$.

Suppose it holds before $w_k$. The word loop computes, by the first lemma, the vector of $R_{k-1} + w_k$ inside the universe, and the OR adds it to the old vector. So after the OR, bit $s$ is one exactly when $s \in R_{k-1}$ or $s \in R_{k-1} + w_k$, which is $R_k$. The mask restores the "no bits above $W$" half of the invariant, and it removes only sums that are not in $R_k$ by definition. If $w_k > W$, the third lemma says $R_k = R_{k-1}$ and the loop is skipped; if $w_k = 0$, the translation is the identity and the loop is skipped.

After all $n$ weights the invariant says that the set bits are exactly the elements of $R_n$. The population count adds one for each set bit, so it returns $|R_n|$. $\square$
:::

The proof has two independent obligations, and a bug in either one is invisible on small inputs. The word arithmetic can be wrong even when the recurrence is right, and the recurrence can be wrong even when every word operation is right. That is why the boolean table of the naive section is kept as a differential reference: it tests the recurrence, and a random instance with a limit above 32 tests the carry.

## Complexity analysis

| Method                     | Time                       | Space           |
| -------------------------- | -------------------------- | --------------- |
| Boolean table              | $O(nW)$                    | $O(W)$ bytes    |
| Hash set of reachable sums | $O(n \ast R)$ expected     | $O(R)$ entries  |
| Bitset with 32-bit words   | $O(nW/32)$ word operations | $O(W/32)$ words |
| Bitset with 64-bit words   | $O(nW/64)$ word operations | $O(W/64)$ words |

One weight touches at most $m$ words, each with two shifts, one OR, and one store, so the inner cost is $O(W/32)$. The outer loop multiplies by $n$. The final population count and the mask are $O(W/32)$ each.

At $n = 2000$ and $W = 10^5$ the bit vector is $3126$ words, or $12.5$ kilobytes, which fits in the first level of cache on every machine that runs a contest. The word loop makes about $6.25 \ast 10^6$ iterations in total, against $2 \ast 10^8$ iterations of the boolean loop.

The speedup is not exactly 32. Each word iteration does two shifts, an OR, a load and a store, while each boolean iteration does a load, a comparison, a branch and a store. Measured over the whole program, a factor between 8 and 32 is typical, and the larger factor appears when the reachable set is dense and the branch predictor does no work to help.

The space bound is the reason the technique has a ceiling. At $W = 10^7$ the vector is $1.25$ megabytes and still fits; at $W = 10^9$ it is $125$ megabytes, which is more than most limits. The time bound has the same ceiling, because every weight still touches every word.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The limit is at most a few million and the items are many | Bitset optimization |
| The limit is small and the items are at most about 20 | [Subset enumeration](/algorithms/enumeration/subset-enumeration) |
| The limit is huge and the items are at most about 40 | [Meet in the middle](/algorithms/enumeration/meet-in-the-middle) |
| The reachable set is sparse | A sorted list or a hash set |
| The number of subsets per sum is required | A counting DP, or generating functions |
| The chosen items must be recovered | A boolean DP with a parent table, or stored per-item vectors |
| Each item is available any number of times | A doubling loop of shifts |
| The sets live in a string or a graph | Shift-And matching, or one bitset per row of a transitive closure |
| The DP value is a maximum or a minimum | A different DP; a bitset stores flags, not values |

The first row and the fourth row are the pair to check first. A bitset is the best choice when the set is dense, because a dense set fills the words and every shift does useful work. When the set is sparse, a list touches only the sums that exist and does not scan the empty words, so it can be faster by a large factor even though its worst case is worse.

The counting row is the other boundary. A bitset can count reachable sums with a population count, but it cannot count the subsets that reach each sum. The moment the answer needs multiplicities, the state is no longer a set and the technique does not apply.

## Reference implementations

The six `program` variants published by the manifest implement one contract:

1. Read $n$ and the limit $W$.
2. Read $n$ positive integer weights.
3. Print the number of distinct subset sums that are at most $W$, counting the empty subset as $0$.

The input is whitespace-separated, so a line break may appear anywhere between two numbers. The stated bounds are $1 \le n \le 2000$, $0 \le W \le 10^5$ and $1 \le w \le 10^9$. A weight above the limit is read and skipped, because no subset that uses it can fit; the program does not stop reading at that point.

All six variants use 32-bit words and the same descending shift loop, so they produce byte-identical output on the shared fixtures. The C variant uses `uint32_t` from `stdint.h`, the C++ variant uses `std::vector<std::uint32_t>`, Java uses `int` with the unsigned right shift, Python keeps a list of words masked with `0xFFFFFFFF`, Pascal uses a dynamic array of `LongWord`, and JavaScript uses a `Uint32Array`.

The 32-bit width is deliberate. JavaScript's bitwise operators produce 32-bit results, and Pascal compiled by pas2js maps `LongWord` onto the same width, so a 64-bit word would have to be split by hand in two of the six languages. The C and C++ variants could use a 64-bit word type and halve the word count, and the complexity table lists that variant; the shared width is what keeps the six listings comparable line by line.

The C and C++ variants read with `scanf`, Java reads the whole standard input in one block and parses it by hand, Python reads and splits the input once, and JavaScript splits the input string. The Pascal variant reads one argument per `Read`, uses `SysUtils`, and never touches `IOResult`, which keeps it inside the subset of the language that the browser compiler accepts.

The population counts are `__builtin_popcount` in C and C++, `Integer.bitCount` in Java, `int.bit_count` in Python, and a multiplication-free SWAR routine in Pascal and JavaScript. The SWAR routine is the same in both languages: five masks and five shifts reduce each word to its bit count in the low 16 bits.

Only the `program` variant is published. There is no reusable `minimal` variant, because the technique is two nested loops and a mask: the caller has to choose the word size, allocate the vector, and decide where the limit is. A class would hide the vector without making either loop clearer.

## Recursion decision

There is no recursion in the technique. The shift is a loop over words, and the outer loop is a loop over weights. Both are iterative in all six languages, and the depth is constant.

The recursion that the bitset replaces is the include-or-exclude search over the items:

```cpp
void search(int item, int sum) {
    if (sum > W) return;
    if (item == n) { reachable[sum] = 1; return; }
    search(item + 1, sum);
    search(item + 1, sum + weights[item]);
}
```

Its depth is $n$, which is at most $2000$ and harmless in every language, but its number of calls is $2^n$, which is the real cost. The bitset does not optimize that recursion; it removes the branching entirely by keeping the set of sums that the recursion would have enumerated.

| Language | Default limit | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB of stack | About $10^5$ frames | The loops; the depth is constant |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The loops |
| Python | Interpreter limit of 1000 | 1000 frames | The loops |
| Pascal | The operating system stack | Depends on the platform | The loops |
| JavaScript | The V8 engine limit | About $10^4$ frames | The loops |

The depth column is irrelevant to this technique, and that is the point. A solution that recurses over items is not a slower version of the bitset; it is a different algorithm with a different state space.

## Implementation walkthrough

Five details decide whether a hand-written bitset is correct.

**The word loop must run downward.** The sources of word $i$ are word $i-q$ and word $i-q-1$, both at most $i$. A descending walk reads each source before this weight writes it. The ascending version uses the item twice, and the failure is silent on every input whose limit is below $64$, because the vector then has at most two words, so a word that is written is never read again by the same weight.

**The carry is skipped when $r = 0$.** A shift by 32 is undefined in C and C++, and JavaScript and Java define it as a shift by 0, which would read the wrong word. The guard is

```cpp
if (bit_shift > 0 && i - word_shift - 1 >= 0) {
    moved |= reachable[i - word_shift - 1] >> (32 - bit_shift);
}
```

**The mask uses the number of valid bits, not the remainder.** With $W = 10$ the top word holds the sums $0$ through $10$, which is $11$ bits, so `top_bits = W % 32 + 1`. Masking with `W % 32` would drop the sum $10$ itself. The mask is skipped when `top_bits == 32`, because `1u << 32` is undefined.

**A weight above the limit is skipped, and a weight of zero is a no-op.** The first skip is justified by positivity, not by the shift; the second is justified because the translation by zero is the identity. Reading the weight into a type wide enough for $10^9$ matters in Pascal and in C, where a 16-bit read would truncate it.

**The population count is one intrinsic per word.** A loop over the 32 bits of a word costs back the factor the technique just won. When the language has no intrinsic, a SWAR routine counts a word in five mask-and-shift steps, and every intermediate must stay in 32-bit arithmetic. The compact Python core below repeats all five details in order:

```python
words = limit // 32 + 1
reachable = [0] * words
reachable[0] = 1
for weight in weights:
    if weight <= 0 or weight > limit:
        continue
    word_shift, bit_shift = divmod(weight, 32)
    for i in range(words - 1, word_shift - 1, -1):
        moved = (reachable[i - word_shift] << bit_shift) & 0xFFFFFFFF
        if bit_shift and i - word_shift - 1 >= 0:
            moved |= reachable[i - word_shift - 1] >> (32 - bit_shift)
        reachable[i] = (reachable[i] | moved) & 0xFFFFFFFF
    if limit % 32 != 31:
        reachable[-1] &= (1 << (limit % 32 + 1)) - 1
```

The compact version above is the Python reference in miniature. The descending range, the carry guard, and the mask are the three lines to compare against the six programs.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Ascending word loop | An item is used twice and sums above the true set appear | Walk the destination words downward |
| Omitting the carry word | Sums that cross a word boundary are lost | Add `source >> (32 - r)` when $r > 0$ |
| Shifting by 32 when $r = 0$ | Undefined in C, a silent no-op in Java and JavaScript | Guard the carry with $r > 0$ |
| Counting before masking the top word | Bits above $W$ are counted as sums | Mask after every weight, or at least before the count |
| Masking with `W % 32` instead of `W % 32 + 1` | The sum $W$ itself is dropped | The top word holds `W % 32 + 1` valid bits |
| Using 64-bit words in JavaScript | Shifts and ORs truncate to 32 bits | Use a `Uint32Array` and `>>> 0` |
| Building the mask with `1 << 32` | Undefined in C, wrong in Java and JavaScript | Skip the mask when the top word is full |
| Allowing negative weights | A masked sum can come back into range | The discard rule needs non-negative weights |

### Why this fails: the item that is used twice

Take the limit $64$ and a single weight $32$. The answer is two, for the sums $0$ and $32$.

The word count is $m = 3$: words $0$ and $1$ hold the sums $0$ through $63$, and word $2$ holds the single sum $64$. The weight gives $q = 1$ and $r = 0$, so every destination word is a copy of the word below it.

The correct descending walk starts at word $2$. It reads word $1$, which is still zero, so the sum $64$ is not produced. It then visits word $1$ and writes bit $0$, the sum $32$, from word $0$. The result is $\{0, 32\}$.

The ascending walk starts at word $1$ and writes the sum $32$. It then reaches word $2$, reads word $1$ again, and writes bit $0$ of word $2$, the sum $64$. The item has been used twice, and the program prints three instead of two.

The smallest input that exposes the bug needs a limit of at least $64$. Below that there are at most two words, and when the word offset is at least one the only destination is word $1$, which is written after every word it reads. This is why a random test on limits below $64$ does not find the bug, even though the code is wrong.

### Why this fails: the carry that is forgotten

Take the limit $32$ and the weights $16$, $8$, $4$, $2$, $1$, then one more weight $1$. The first five weights reach every sum from $0$ through $31$, and the last weight adds $32$, so the answer is $33$.

Bit $31$ lives in the top bit of word $0$. Adding $1$ makes it bit $0$ of word $1$, and the only term that moves it there is `word[0] >> 31`, the carry with $r = 1$. A program that keeps the whole-word shift `word[0] << 1` but drops the carry writes nothing to word $1$, and it prints $32$. The missing sum is exactly $W$, which is the one sum a boundary test should check.

Both failures share a shape: the code is right for every input that fits in one word, and wrong as soon as the set spans two. A test set that never crosses a word boundary exercises almost none of the technique.

## Variants and extensions

- **64-bit words.** The same loop with `std::uint64_t` and shifts by 64 halves the word count. C, C++, Java, Rust and Pascal can use it; JavaScript cannot, because its bitwise operators are 32-bit.
- **A bitset per DP state.** When the state has a second small dimension, store one bit vector per value of the first dimension. The coin problem below uses `dp[sum]` as a bitset of the values that the paying subset can make, and the transition shifts that vector by the coin.
- **Bounded multiplicities.** If an item is available $c$ times, split $c$ into powers of two and shift by $w$, $2w$, $4w$, and so on. The number of shifts becomes logarithmic in $c$, which is the same binary grouping that a bounded knapsack uses.
- **Unbounded items.** If an item is available any number of times, shift by $w$, then by $2w$, then by $4w$, until the shift exceeds $W$. After $t$ steps every multiple of $w$ up to $(2^t - 1)w$ is reachable, so the loop reaches the closure in $O(\log(W/w))$ shifts.
- **Shift-And string matching.** Keep one bit vector per character, holding the positions where that character occurs. To match a pattern, shift and AND the masks for its characters; the set bits of the result are the match positions.
- **Transitive closure.** Store the reachable set of every vertex as a bit vector and OR rows together, which turns the innermost loop of a Floyd-Warshall or a BFS over dense graphs into word operations.
- **Tree subset sums.** The PermuTree problem below runs a subset sum over child subtree sizes at every vertex. The hard version combines three reductions: skip the subset sum when one child is at least half of the total, group equal sizes by binary splitting, and run the rest on a bitset.
- **Compressed bitmaps.** When the universe is huge and sparse, a compressed representation such as a roaring bitmap keeps the set operations but stores only the occupied blocks. This is a library technique, not a contest one, and it trades the simple shift for a more complicated container.

## Contest strategy

1. Check that the state is a set of integers and that the limit is bounded. If the answer needs multiplicities or a maximum value, the bitset is the wrong state.
2. Estimate the cost: $n$ times $W/32$ word operations. If that is below about $10^8$, the bitset is comfortable in every language; near $10^9$, only the compiled languages are.
3. Write the boolean table first, even if it is too slow. It is the differential reference, and it is short enough to trust.
4. Write the word loop with the descending order and the carry. Test it against the boolean table on random instances whose limit is above 64, so that both the carry and the word offset are exercised.
5. Mask the top word and count with the intrinsic. Check the boundary by hand with a limit that is a multiple of 32 and a weight equal to the limit.
6. Time the worst case once, with $n$ and $W$ at their stated bounds. The asymptotics are simple, but the constant depends on how dense the reachable set is and on whether the vector stays in cache.

## Worked problems

### Problem 1: the closest total

**Restatement.** There are $n \le 1000$ plates, each weighing at most $1000$ kilograms. Choose a subset whose total is as close as possible to $1000$ kilograms, and on a tie choose the larger total.

**Naive baseline.** Enumerate the $2^n$ subsets and keep the closest total, which is impossible for $n = 1000$.

**Insight.** The reachable totals are a set, so they fit in a bit vector, and one shift per plate updates the whole set. The target is $1000$, but the answer may exceed it, so the universe is $0$ through $2000$.

**Derivation.** Start with bit $0$. For each plate, shift the vector by its weight and OR it back, then mask to $2001$ bits. Scan outward from $1000$ for the nearest set bit and prefer the larger total on a tie.

**Correctness.** A subset whose total is minimal among those above $1000$ has total at most $2000$: removing any one plate from it leaves at most $1000$, so its total is at most $1000$ plus its heaviest plate, which is at most $2000$. The optimal total is therefore inside the universe, and the scan finds it.

**Complexity.** $O(n \ast 2001/32)$ word operations and $O(2001/32)$ words, which is about $63$ words for the largest input.

**Common wrong approach.** Capping the universe at $1000$, which finds $998$ in the sample with plates $900$, $500$, $498$ and $4$ and misses the better total $1002$.

### Problem 2: the values a paying subset can make

**Restatement.** There are $n \le 500$ coins and a price $k \le 500$. List every value $x$ such that some subset of the coins with total $k$ has a subset with total $x$.

**Naive baseline.** A three-dimensional boolean table over the number of coins, the paying sum, and the value, which costs $O(nk^2)$ and is already fast enough at $k = 500$.

**Insight.** For a fixed paying sum, the set of values is a bit vector of $k + 1$ bits. Adding a coin to the paying subset shifts that vector by the coin, and the branch that does not use the coin leaves it alone.

**Derivation.** Keep `dp[j]` as a bitset over the values that a paying subset of total $j$ can make. Initialize `dp[0]` with bit $0$. For each coin $c$, walk $j$ downward from $k$ to $c$ and set

```text
dp[j] |= dp[j - c] | (dp[j - c] << c)
```

The old `dp[j]` keeps the subsets that leave the coin out. The term `dp[j - c]` adds the values made when the coin is paid but not used again, and `dp[j - c] << c` adds the values made when the coin is used in both places. The answer is the set of bits in `dp[k]`.

**Correctness.** The recurrence is the three cases of the original statement, and the descending walk reads `dp[j - c]` before this coin can write it, which is the 0/1 rule. The bits of `dp[k]` are exactly the values that some paying subset can make, with no duplicates because each value is one bit.

**Complexity.** $O(nk^2/32)$ word operations and $O(k^2/32)$ words. With $k = 500$ each bitset is $16$ words and the table holds $501$ of them, about $32$ kilobytes.

**Common wrong approach.** Writing `dp[j] |= dp[j - c] << c` and dropping the unshifted term. That loses every value that the paying subset makes without the coin, which is most of them.

### Problem 3: the best split of child subtrees

**Restatement.** A rooted tree has $n \le 10^6$ vertices. Assign the values $1$ through $n$ to the vertices, one value each, to maximize the number of pairs $(u, v)$ with $a_u < a_{\operatorname{lca}(u,v)} < a_v$.

**Naive baseline.** For each vertex, try every way to split its child subtrees into the group below the vertex and the group above it, which is exponential in the number of children.

**Insight.** The pairs whose lowest common ancestor is $v$ are exactly the pairs with one endpoint in a child subtree placed below $a_v$ and one in a child subtree placed above it. If the two groups hold $L$ and $R$ vertices in total, the count is $L \ast R$, and the choice at $v$ does not affect any other vertex. So the problem is a subset sum over the child subtree sizes at every vertex.

**Derivation.** Compute subtree sizes bottom-up. At each vertex, take the multiset of child sizes and find the reachable sum closest to half of their total; add the product of the best sum and the rest. For the hard version, handle the largest child directly when it is at least half of the total, group equal sizes by binary splitting, and run the subset sum on a bitset. In the first sample, the root has children of sizes $1$ and $3$, so the split is $1$ and $3$ and the root contributes $3$; the other internal vertex has two children of size $1$, so it contributes $1$; the total is $4$.

**Correctness.** A child subtree is entirely below or entirely above the value at its parent, because the parent's value is a single threshold. The contribution at the parent is therefore the product of the two group sizes, and the choices at different vertices are independent. Maximizing each product separately maximizes the sum.

**Complexity.** The subset sum at a vertex costs $O(s/32)$ words for a subtree of $s$ vertices. The immediate case removes the vertices with one dominant child, the binary grouping keeps the number of shifts logarithmic in each multiplicity, and together they keep the total within the intended bound for the hard version.

**Common wrong approach.** Balancing the sides greedily by placing each child in the currently smaller group. With child sizes $8$, $7$, $6$, $5$ and $4$, the greedy split reaches $14$ against $16$, for $224$ pairs, while the exact split $8 + 7$ against $6 + 5 + 4$ reaches $225$.

## Practice progression

1. **Recognition.** Given a dynamic program, decide whether its state is a set of bounded integers and whether the answer is a count of reachable values or something that needs multiplicities.
2. **Direct application.** Implement the closest-total problem with a bitset of $2001$ bits, and compare it with the boolean table on random inputs.
3. **Adaptation.** Write the word-level shift by hand in C or Python, including the carry, and check it against `std::bitset` or a boolean table on limits above 64.
4. **Combination.** Add the second dimension of the paying-subset problem, so that each state owns a bitset, and verify that the descending loop preserves the 0/1 rule.
5. **Advanced.** Implement the tree problem with the immediate case and the binary grouping of equal sizes, and compare the bitset version with the quadratic DP of the easy version.
6. **Transfer.** Use the same word parallelism on a different structure: Shift-And matching with one mask per character, or a transitive closure with one bitset per vertex.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What is stored in a bit vector, and what does one bit mean? (Formal model)
2. Write the transition for adding a weight $w$, and explain each of its two terms. (Key insight)
3. Why does the OR need the old vector, and not the vector after the shift? (Key insight)
4. Split $w = 32q + r$. Which word and which bits does output word $i$ read? (Formal model)
5. Why must the loop over destination words run downward? (Implementation walkthrough)
6. What is the smallest limit and weight that expose an ascending loop, and what does the buggy program print? (Common mistakes)
7. Why is the carry skipped when $r = 0$? (Implementation walkthrough)
8. How many valid bits does the top word hold, and how is the mask built? (Implementation walkthrough)
9. Why is a weight above $W$ skipped, and which property of the weights justifies it? (Formal model)
10. Why does a bitset answer "how many sums" but not "how many subsets per sum"? (Recognition patterns)

## Further reading

- The subject index lists this technique beside the other advanced ones in [the advanced algorithms](/algorithms/advanced/).
- The dynamic program that this technique accelerates is [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The exhaustive baseline that the bitset replaces is [subset enumeration](/algorithms/enumeration/subset-enumeration), and the large-universe alternative is [meet in the middle](/algorithms/enumeration/meet-in-the-middle).
- The representation of the state as bits, including shifts and masks, is in [binary representation](/algorithms/foundations/binary-representation).
- The cost model that turns word operations into a running time is in [complexity](/algorithms/foundations/complexity).
- The word-parallel idea over the field of two elements, where the vectors are basis elements rather than sums, is in [XOR bases](/algorithms/advanced/xor-bases).
- The string version of the same shift, where the masks are character positions and the operation is AND rather than OR, is in [KMP](/algorithms/strings/kmp) and its Shift-And relatives.
- The tree problem that runs a subset sum at every vertex uses [tree DP](/algorithms/trees/tree-dp) and [depth-first search](/algorithms/graphs/dfs).
