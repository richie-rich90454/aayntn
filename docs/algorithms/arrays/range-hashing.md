---
id: arrays.range-hashing
title: Range hashing
summary: Fingerprint every prefix of a static array with a fixed polynomial hash, so that comparing two ranges costs one subtraction and one multiplication.
division: [gold]
subjects: [arrays]
level: intermediate
importance: common-contest-technique
keywords:
    [
        range hashing,
        prefix hash,
        polynomial hash,
        subarray equality,
        rolling hash,
        collision,
        64-bit,
    ]
prerequisites:
    required: [arrays.prefix-sums, foundations.complexity]
    recommended: [strings.rolling-hash, number-theory.modular-arithmetic]
complexity:
    time: "O(n + q)"
    space: "O(n)"
assumptions:
    - The array is static, so the prefix fingerprints and the powers of the base can be built once.
    - A hash collision is either acceptable or checked with a direct comparison.
implementations: arrays.range-hashing
reviewed: false
---

## At a glance

<AlgorithmSummary algorithm="arrays.range-hashing" />

<!-- The raw implementation, placed here so that a reader who came for the code does not have to scroll to the end of the article. -->

<CodeViewer algorithm="arrays.range-hashing" />

Range hashing answers the question "are these two ranges of the array the same?" without looking at either range element by element. Each prefix of the array is reduced to a single 64-bit fingerprint, and the fingerprint of a range is recovered from two prefix fingerprints in constant time.

The construction is the polynomial hash that string algorithms use, applied to an array of integers. With the base $B = 911\,382\,323$ and the modulus $M = 2^{64} = 18\,446\,744\,073\,709\,551\,616$, the prefix fingerprint is

$$
H[i] \;=\; \Bigl(\sum_{j=1}^{i} a_j \ast B^{i-j}\Bigr) \bmod M,
$$

and the fingerprint of the inclusive range $[l, r]$ is

$$
R(l, r) \;=\; \bigl(H[r] - H[l-1] \ast B^{r-l+1}\bigr) \bmod M.
$$

Two ranges are compared by comparing their fingerprints. Equal ranges always have equal fingerprints. Different ranges usually have different fingerprints, but not always: a collision is possible, and the whole art of using the technique is deciding what to do about that.

The cost is $O(n)$ preprocessing, $O(1)$ per comparison, and $O(n)$ memory for the two tables. It applies when the array does not change and the questions are about equality of ranges, not their sums.

## Problem motivation

A version-control system stores snapshots of a large file as an array of $n$ bytes. Reviewers ask $q$ questions of the form "is the block that starts at position $l_1$ identical to the block that starts at position $l_2$, and does the comparison cover $k$ bytes?". The blocks are compared often, they are long, and most pairs differ only near the end.

The constraints:

- $1 \le n \le 200\,000$ bytes.
- $1 \le q \le 200\,000$ questions.
- Every block has the same length $k$, which can be as large as $n$.
- The snapshots never change during the queries.

The naive answer compares the two blocks byte by byte, at a cost of $O(k)$ per question and $O(qk)$ over the run. With $k = n = 200\,000$ that is $4 \cdot 10^{10}$ comparisons, which is too slow, and the worst case is easy to construct: make every pair of blocks agree on a long prefix and disagree at the last byte.

The comparison is doing the same work repeatedly. If two blocks share a prefix of length $p$, a byte-by-byte comparison rediscovers that prefix on every question. A fingerprint summarizes the whole block once, so the second question about the same block does not repeat the first one's work.

The technique is the array version of the rolling hash used for strings. The difference is mostly in the framing: the values are arbitrary signed integers rather than characters, the modulus is the fixed width of a machine word, and the queries name two ranges rather than a pattern and a text.

## Recognition patterns

Range hashing is the right tool when all of the following hold.

- The array is **static**: no value changes between the preprocessing and the queries.
- The question is **equality of two ranges**, or something reducible to it: duplicate detection, common prefixes, repeated blocks, palindrome checks.
- The ranges are **long**, so a direct comparison is expensive.
- There are **many** comparisons, so the $O(n)$ preprocessing pays for itself.
- The answer tolerates a **negligible** collision probability, or a hash match is verified with a direct comparison.

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| One comparison of two ranges | Rules it out; a direct scan is simpler and exact |
| $q \ge n$ comparisons | Rules it in; $O(n + q)$ against $O(nq)$ |
| Values change between queries | Rules out the static tables; use a segment tree of hashes |
| The question is a range sum | Rules it out; prefix sums are exact and simpler |
| The question ignores order (multiset equality) | Rules out the polynomial hash; use an order-independent fingerprint |
| The answer must be exact, with no verification | Rules out a single hash; use a suffix array or verify matches |
| The array is one element long | Rules it out; a direct comparison is one operation |
| The ranges can have different lengths | Keep the technique, but compare the lengths before the hashes |

The phrases in a statement that signal the technique are "the same content", "identical subarrays", "equal segments", "find a duplicate block", and "compare the two substrings". The phrase that rules it out is "after each update", because a changed value invalidates every later prefix fingerprint.

<Synonyms terms="range hashing, prefix hashing, subarray hashing, polynomial hash, range fingerprint" />

## Naive approach

The baseline compares the two ranges directly.

```python
def same(a, l1, r1, l2, r2):
    if r1 - l1 != r2 - l2:
        return False
    for offset in range(r1 - l1 + 1):
        if a[l1 + offset] != a[l2 + offset]:
            return False
    return True
```

This is exact, it costs $O(k)$ per question, and it is the reference implementation for a differential test. The early exit makes it fast on random data, because most comparisons fail on the first few values, but it does not improve the worst case.

The second baseline is the one that motivates the technique: compute the polynomial hash of each range from scratch.

```python
def slow_hash(a, l, r):
    value = 0
    for i in range(l, r + 1):
        value = (value * BASE + a[i]) & MASK
    return value
```

This is the same fingerprint, computed the obvious way. It is still $O(k)$ per question, so it buys nothing over the direct comparison. The entire point of the prefix construction is that the fingerprint of a long range is assembled from two fingerprints that were computed once.

## Key insight

The insight is that **the polynomial evaluation of a prefix extends to the next element by one multiply and one add**, and that a range is the difference of two such evaluations after the earlier one is shifted into alignment.

Write the fingerprint of the first $r$ values, with the first value carrying the highest power:

$$
H[r] \;=\; a_1 B^{r-1} + a_2 B^{r-2} + \cdots + a_r.
$$

The fingerprint of the first $l-1$ values is the same polynomial stopped earlier:

$$
H[l-1] \;=\; a_1 B^{l-2} + a_2 B^{l-3} + \cdots + a_{l-1}.
$$

Multiplying $H[l-1]$ by $B^{r-l+1}$ shifts every one of its terms to the power it would have in $H[r]$:

$$
H[l-1] \ast B^{r-l+1} \;=\; a_1 B^{r-1} + a_2 B^{r-2} + \cdots + a_{l-1} B^{r-l+1}.
$$

Subtracting that from $H[r]$ cancels every term before $l$, and what remains is exactly the polynomial of $a_l, \ldots, a_r$. That is the range fingerprint.

The construction is therefore a prefix table with a different combining operation. Prefix sums add; range hashing multiplies by the base and adds. Both spend $O(n)$ once and answer a query with a constant number of table lookups and arithmetic operations.

## Visual intuition

The table below shows the array and the fingerprint of every prefix. The entries are written as expressions rather than decimal numbers so that the alignment is visible.

| $i$ | $a_i$ | $H[i]$                        |
| --- | ----- | ----------------------------- |
| 0   | -     | $0$                           |
| 1   | 3     | $3$                           |
| 2   | -1    | $3B - 1$                      |
| 3   | 4     | $(3B - 1)B + 4$               |
| 4   | 1     | $((3B - 1)B + 4)B + 1$        |
| 5   | -5    | $(((3B - 1)B + 4)B + 1)B - 5$ |

Each row is the previous row multiplied by $B$ and then increased by the new value. The fingerprint is a number, not a sorted summary: the position of every value is encoded in its exponent.

To compare the range $[2, 4]$ with the range $[1, 3]$, the program computes two fingerprints, and each fingerprint is a subtraction of two rows after the earlier row is shifted. The two results differ, which is the expected answer because the contents differ. The picture to keep in mind is two overlapping polynomials: shifting the shorter one by the right number of powers makes the common prefix cancel.

The values of $H$ are not monotone and have no order worth using. A negative value pulls the fingerprint down, and a large value pushes it up, but the fingerprint is only meaningful when it is compared with another fingerprint of the same length. This is why no binary search is performed on the table, and why sorting it would destroy the information it carries.

## Formal model

Let $a_1, a_2, \ldots, a_n$ be the values of the array, indexed from one.

::: math definition Definition
Fix a base $B$ and a modulus $M$. The **prefix fingerprint** $H[i]$ is

$$
H[i] \;=\; \Bigl(\sum_{j=1}^{i} a_j \ast B^{i-j}\Bigr) \bmod M \quad \text{for } 0 \le i \le n,
$$

with $H[0] = 0$. The table has $n + 1$ entries.
:::

::: math definition Definition
The **range fingerprint** of the inclusive range $[l, r]$ is

$$
R(l, r) \;=\; \bigl(H[r] - H[l-1] \ast B^{r-l+1}\bigr) \bmod M.
$$

The range is empty when $l > r$, and the fingerprint of an empty range is $0$.
:::

::: math lemma Lemma
For every $1 \le l \le r \le n$, the range fingerprint satisfies

$$
R(l, r) \;=\; \Bigl(\sum_{j=l}^{r} a_j \ast B^{r-j}\Bigr) \bmod M.
$$
:::

::: math recurrence Recurrence
The prefix fingerprints and the powers of the base are computed by

$$
H[0] = 0, \qquad H[i] = (H[i-1] \ast B + a_i) \bmod M,
$$

$$
P[0] = 1, \qquad P[i] = (P[i-1] \ast B) \bmod M,
$$

for $i = 1, 2, \ldots, n$. Every entry depends on exactly one earlier entry, so both tables are built in one left-to-right pass.
:::

::: math definition Definition
A **collision** is a pair of different ranges $[l_1, r_1]$ and $[l_2, r_2]$ with $r_1 - l_1 = r_2 - l_2$ and $R(l_1, r_1) = R(l_2, r_2)$.
:::

The fixed constants used by this article and by every reference implementation are $B = 911\,382\,323$ and $M = 2^{64}$. The base is odd, so multiplication by it permutes the residues modulo $2^{64}$; an even base would drive the low bits to zero and lose information. The modulus is the width of an unsigned 64-bit word.

## Algorithm derivation

The state is two tables of $n + 1$ entries: the prefix fingerprints $H$ and the powers $P$.

The build is:

1. Set $H[0] = 0$ and $P[0] = 1$.
2. For $i$ from $1$ to $n$, read $a_i$, then set $H[i] = H[i-1] \ast B + a_i$ and $P[i] = P[i-1] \ast B$, both modulo $M$.

The query for ranges $[l_1, r_1]$ and $[l_2, r_2]$ is:

1. If the ranges have different lengths, print `NO` and stop. Different lengths cannot have the same content.
2. Compute $R(l_1, r_1)$ and $R(l_2, r_2)$ with the formula from the formal model.
3. Print `YES` when the two fingerprints are equal, and `NO` otherwise.

The build is correct by induction. Before the loop, $H[0] = 0$ is the empty polynomial. If $H[i-1]$ is the polynomial of the first $i-1$ values, then multiplying by $B$ shifts every exponent up by one and adding $a_i$ appends the new value at the bottom. That is exactly the polynomial of the first $i$ values.

The query is correct in the one direction that matters for equality. If two ranges have the same values in the same order, their polynomials are identical, so their fingerprints are identical. Lengths must be compared first because a fingerprint does not encode the length; the shift exponent does, but two ranges of different lengths should never be compared as if they could match.

The offset discipline is the same as in prefix sums. The table is indexed from zero with $H[i]$ meaning "the first $i$ values", and the query is one-based. The value at position $l$ is inside the range, so the table entry to subtract is $H[l-1]$, not $H[l]$.

::: math invariant Invariant
After the update for index $i$, the entries $H[0], H[1], \ldots, H[i]$ hold the fingerprints of the prefixes of lengths $0, 1, \ldots, i$, and $P[0], \ldots, P[i]$ hold $B^0, \ldots, B^i$ modulo $M$.
:::

## Step-by-step execution

Take $a = [3, -1, 4, 1, -5]$ and the fixed constants $B = 911\,382\,323$ and $M = 2^{64}$.

The prefix fingerprints are:

| $i$ | $a_i$ | $H[i]$                           |
| --- | ----- | -------------------------------- |
| 0   | -     | 0                                |
| 1   | 3     | 3                                |
| 2   | -1    | 2\,734\,146\,968                 |
| 3   | 4     | 2\,491\,853\,215\,119\,246\,668  |
| 4   | 1     | 12\,336\,565\,884\,267\,258\,405 |
| 5   | -5    | 2\,949\,137\,335\,391\,084\,634  |

The powers of the base are:

| $k$ | $P[k] = B^k \bmod M$             |
| --- | -------------------------------- |
| 0   | 1                                |
| 1   | 911\,382\,323                    |
| 2   | 830\,617\,738\,676\,876\,329     |
| 3   | 16\,686\,890\,588\,905\,902\,891 |
| 4   | 11\,586\,767\,014\,129\,217\,169 |
| 5   | 3\,004\,515\,556\,260\,990\,435  |

Now the queries.

- The range $[2, 4]$ is $H[4] - H[1] \ast P[3] = 12\,336\,565\,884\,267\,258\,405 - 3 \ast 16\,686\,890\,588\,905\,902\,891$, which reduces to $17\,616\,126\,338\,678\,204\,580$. The direct polynomial of $[-1, 4, 1]$ is the same number.
- The range $[1, 5]$ is $H[5] - H[0] \ast P[5] = H[5] = 2\,949\,137\,335\,391\,084\,634$, because the empty prefix contributes nothing.
- The range $[3, 3]$ is $H[3] - H[2] \ast P[1] = 4$, which is the value at position three, as it must be.

The third query is worth pausing on. A range of length one always hashes to its own value, regardless of the base or the modulus, because the polynomial has one term and that term is $a_l \ast B^0$. Length-one ranges are therefore compared exactly. A length-two range can already collide: with the stated base, $[0, 911\,382\,323]$ and $[1, 0]$ have the same fingerprint, because $0 \ast B + B = 1 \ast B + 0$. The collision is a property of the fixed base, not a bug in the arithmetic, and it is why the next section treats a hash match as evidence rather than proof.

## Correctness proof

::: math theorem Theorem
If two ranges have the same content, the program prints `YES`. If the program prints `YES` for two ranges of the same length, then either the ranges have the same content or the pair is a collision.
:::

::: math proof Proof
First the construction. The build sets $H[0] = 0$, the empty polynomial. Suppose $H[i-1]$ is the polynomial of the first $i-1$ values. The update sets $H[i] = H[i-1] \ast B + a_i$, which shifts every earlier term by one power and appends $a_i$. By induction, every entry holds the polynomial of its prefix.

Now the query. For a range $[l, r]$,

$$
H[r] - H[l-1] \ast B^{r-l+1}
\;=\; \sum_{j=1}^{r} a_j B^{r-j} - \sum_{j=1}^{l-1} a_j B^{r-j}
\;=\; \sum_{j=l}^{r} a_j B^{r-j},
$$

because the terms before $l$ appear in both sums with the same exponent and cancel. That is the polynomial of the range, so the computed fingerprint is the range fingerprint.

If two ranges have the same values at every position, their polynomials are equal term by term, so their fingerprints are equal and the program prints `YES`.

If two ranges differ, their polynomials differ as polynomials, but their values modulo $M$ can still be equal. That is a collision, and in that case the program prints `YES` for different content. The theorem is therefore one-sided: equality of content implies equality of fingerprints, not the reverse. $\square$
:::

::: math proof Proof
The length check is exact. Two ranges of different lengths cannot have the same content, and the program prints `NO` without consulting the fingerprints, so it never reports a match for a length mismatch.
:::

The proof does not claim that collisions are impossible, and no fixed-width fingerprint can claim that while it stores less than the whole range. What the technique buys is a cheap test whose error probability can be made small enough for a contest.

## Complexity analysis

**Building the tables: $O(n)$ time.** The loop performs two multiplications and one addition per element and runs once.

**Each comparison: $O(1)$ time.** The program compares the lengths, then performs two multiplications, two subtractions, and one equality test. Nothing scans the range.

**The whole run: $O(n + q)$ time** and **$O(n)$ auxiliary space**, because the two tables have $n + 1$ entries each and the queries are processed one at a time.

::: math complexity Complexity
Range hashing over a static array of $n$ values: $O(n)$ preprocessing, $O(1)$ per range comparison, $O(n + q)$ time in total, and $O(n)$ extra space for the prefix fingerprints and the powers of the base.
:::

The constants deserve a note. The tables hold $n + 1$ unsigned 64-bit entries each, so the memory is $16(n + 1)$ bytes: about 3.2 MB at $n = 200\,000$ and about 16 MB at $n = 10^6$. That is usually acceptable, but it is twice the memory of a single prefix-sum table.

The arithmetic is also wider than it looks. Each native multiplication is a 64-bit multiply whose high half is discarded, which is one machine instruction on the usual architectures. In C, C++, and Java the wrap is the definition of unsigned arithmetic or of two's complement arithmetic; Pascal, Python, and JavaScript perform the same reduction with limbs or masks. A version that uses signed 64-bit overflow in C++ is undefined behavior, and an optimizing compiler is allowed to produce anything.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Static array, many equality questions about ranges | Range hashing |
| Static array, one equality question | A direct comparison |
| Static array, exact answers required | Suffix array with an LCP table, or verify each hash match |
| Point updates and range equality | Segment tree storing a hash per node |
| Range sums | Prefix sums |
| Range minimum or maximum | Sparse table or segment tree |
| Multiset equality, order ignored | Sum or XOR of random labels |
| Pattern matching in a static array | KMP, Z-algorithm, or range hashing |
| Longest common prefix of two suffixes | Binary search on the length with range hashing |
| Palindrome checks on a static string | Manacher, or forward and reverse range hashes |

The last row is a reminder that the technique generalizes to any sequence, not only to arrays of numbers. A string is an array of character codes, and the same tables answer substring equality. The [rolling hash](/algorithms/strings/rolling-hash) article develops the string version in more detail, including double hashing and the choice of a prime modulus.

The row that is easy to get wrong is multiset equality. A polynomial hash depends on the order of the values, so it answers "same sequence", not "same collection". If the question is whether two ranges contain the same values in any order, the polynomial hash is the wrong fingerprint; an order-independent one is needed.

## Reference implementations

The six programs above implement one contract:

1. Read $n$.
2. Read $n$ integers, the array.
3. Read $q$.
4. Read $q$ lines, each with four integers $l_1$, $r_1$, $l_2$, $r_2$, all 1-based and inclusive, with $l_1 \le r_1$ and $l_2 \le r_2$.
5. Print one line per query: `YES` if the two ranges have the same length and the same content, `NO` otherwise.

The tables are built once, before the first query. The C, C++, and Java versions use native 64-bit arithmetic and let it wrap, while the Python and JavaScript versions apply a mask of $2^{64} - 1$ after every operation. The JavaScript version uses `BigInt` because a `Number` cannot represent all 64-bit integers exactly. The Pascal version stores each fingerprint as four 16-bit limbs, because the browser-based compiler used for its listing represents `QWord` as a double; the limb arithmetic is still exactly modulo $2^{64}$.

All six use the same base and modulus, so they produce the same fingerprints and therefore the same answers on the shared fixtures. The fixed constants are a deliberate choice for reproducibility: a randomized base would make the programs disagree with each other unless the random seed were also fixed.

The manifest publishes only the `program` variant, one per language. There is no reusable `minimal` variant because the interesting part of the technique is the contract around the tables, not a single function: the caller has to build the powers, keep the two tables alive, and decide what to do on a collision.

## Recursion decision

Range hashing is a left-to-right fold, and a fold is naturally a loop. The recursive form of the prefix fingerprint is

```python
def fingerprint(i):
    if i == 0:
        return 0
    return (fingerprint(i - 1) * BASE + a[i - 1]) & MASK
```

It computes the same values. A single call for $i = n$ is $O(n)$, but it returns only the last fingerprint; filling the whole table by calling it for every $i$ repeats the shorter prefixes and costs $O(n^2)$ unless the results are memoized. Memoizing turns it back into the loop. The recursion depth is also $n$, which exceeds the default stack of every language in the table.

| Language   | Default limit              | Practical depth         | Recommendation |
| ---------- | -------------------------- | ----------------------- | -------------- |
| C and C++  | 8 MB of stack              | About $10^5$ frames     | Use the loop   |
| Java       | 512 KB to 1 MB per thread  | About $10^4$ frames     | Use the loop   |
| Python     | Interpreter limit of 1000  | 1000 frames             | Use the loop   |
| Pascal     | The operating system stack | Depends on the platform | Use the loop   |
| JavaScript | The V8 engine limit        | About $10^4$ frames     | Use the loop   |

There is one place where a tree-shaped computation is the right answer: when the array changes. A segment tree stores the hash of every segment, and a point update recomputes the hashes on one root-to-leaf path in $O(\log n)$. That is a different data structure built on the same fingerprint, and it is the subject of the variants section rather than of this one.

## Implementation walkthrough

Four details decide whether a range-hashing program is correct.

**The power table is not optional.** The query needs $B^{r-l+1}$, and computing that power from scratch with a loop would make each query $O(\text{length})$. Build $P$ next to $H$ in the same pass, with $P[0] = 1$.

**The exponent is the length of the range, not the difference of the endpoints minus one.** For the one-based inclusive range $[l, r]$, the length is $r - l + 1$. A query that uses $r - l$ shifts the earlier prefix by one power too few and cancels the wrong terms.

**Negative values need a convention.** The mathematical definition reduces every value modulo $M$. C and C++ get that reduction for free by casting to an unsigned type, Java gets it from two's complement `long`, and Pascal performs it with the limb representation described above. Python's `%` already returns a non-negative residue, and the explicit mask makes the intent visible. JavaScript's `BigInt` bitwise and with $2^{64} - 1$ does the same.

**Lengths are compared before fingerprints.** A fingerprint does not carry the length in a way that can be compared across ranges, and two ranges of different lengths must never be treated as candidates for equality.

The core of the Python program is short enough to read in one screen:

```python
MASK = (1 << 64) - 1
BASE = 911382323

prefix = [0] * (n + 1)
power = [1] * (n + 1)
for i in range(1, n + 1):
    prefix[i] = (prefix[i - 1] * BASE + a[i - 1]) & MASK
    power[i] = (power[i - 1] * BASE) & MASK

for each query (l1, r1, l2, r2):
    if r1 - l1 != r2 - l2:
        print("NO")
        continue
    length = r1 - l1 + 1
    h1 = (prefix[r1] - prefix[l1 - 1] * power[length]) & MASK
    h2 = (prefix[r2] - prefix[l2 - 1] * power[length]) & MASK
    print("YES" if h1 == h2 else "NO")
```

The mask appears after the subtraction as well as after the multiplication. Without it, Python would produce a negative number for the range fingerprint, and two equal ranges would still compare equal, but the values would no longer match the definition and would not agree with the other five languages on intermediate checks.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Subtracting $H[l-1]$ without multiplying by a power | The prefixes are misaligned and almost every answer is wrong | Shift the earlier prefix by $B^{r-l+1}$ |
| Using the exponent $r - l$ | The first value of the range is canceled | The exponent is the range length, $r - l + 1$ |
| Building only the prefix table | The power is recomputed per query, or the query cannot be answered | Build $P$ in the same pass |
| Using signed overflow in C or C++ | Undefined behavior; the optimizer may delete the wrap | Use `unsigned long long` or `uint64_t` |
| Forgetting the length check | Two ranges of different lengths can be reported equal | Compare lengths before the fingerprints |
| Using a hash of the values without positions | Multiset equality is answered instead of sequence equality | Keep the polynomial order |
| Rebuilding the tables after every update | The cost is $O(n)$ per update, worse than a scan | Use a segment tree of hashes |
| Treating a hash match as proof | A collision produces a wrong `YES` | Verify the match, or use two hashes |
| Choosing an even base | The base shares a factor with the modulus, so earlier values vanish from the low bits and collisions become structured | Use an odd base, and a large one |
| Hashing a query from scratch | The cost is $O(nq)$ again | Build the tables once |

### Why this fails: the hash is a fingerprint, not a proof

The failure mode that survives review most often is believing that equal fingerprints mean equal ranges.

With a deliberately small modulus the failure is easy to see. Take $M = 1009$ and $B = 10$. The sequences $[1, 0]$ and $[0, 10]$ both hash to $10$, because $1 \ast 10 + 0 = 0 \ast 10 + 10$. The two ranges are different, the fingerprints are equal, and a program that trusts the fingerprint reports a false match. The collision is not an implementation bug; it is the pigeonhole principle, since there are more ranges of length two over the integers than there are residues modulo $1009$.

The same phenomenon exists modulo $2^{64}$, only much less often for accidental inputs. The modulus is not prime, so the classical "at most $d$ roots for a degree-$d$ polynomial" bound does not apply directly, and an adversary who knows the base can search for a collision offline. On a judge with fixed tests and no hacking phase, that is a small risk. In a contest with open hacks, a fixed base is a liability, and the standard answer is to randomize the base at runtime or to use two independent hashes.

The second failure is a changed array. The table describes the array at the moment it was built. If a value changes, every later prefix fingerprint changes, so repairing the table costs $O(n)$ per update. That is the same cost as scanning the range for every query, which means the structure has bought nothing. The fix is a segment tree whose nodes store fingerprints, not a larger prefix table.

## Variants and extensions

- **Double hashing.** Use two bases and two moduli, or one 64-bit modulus and two bases, and require both fingerprints to match. The two collision probabilities multiply, so the combined risk shrinks, and the cost per query is a small constant factor more.
- **Randomized base.** Choose $B$ at runtime from a random distribution instead of fixing it. This defeats an adversary who prepared collisions offline, at the cost of reproducibility.
- **Order-independent fingerprints.** For multiset equality, assign each value a random 64-bit label and store the sum or XOR of the labels over the range. XOR is fast but cancels duplicate pairs; sum is safer when duplicates matter.
- **Two-dimensional range hashing.** Hash every row and then hash the row hashes, or use a two-dimensional polynomial. Rectangle equality then follows from a two-dimensional version of the same subtraction.
- **Segment tree of hashes.** Store the fingerprint of every segment and combine two children as $H_{\text{left}} \ast B^{\text{len(right)}} + H_{\text{right}}$. Point updates and range equality both cost $O(\log n)$, and the same structure handles palindromes with a second tree over the reversed array.
- **Suffix array and LCP.** For exact substring equality on a static string, a suffix array with an LCP table answers in $O(1)$ after $O(n \log n)$ preprocessing and has no collision risk.
- **KMP and Z-algorithm.** For matching one pattern against a text, these are deterministic and linear, and they avoid the hash entirely.
- **Longest common prefix by binary search.** Hash the two suffixes, binary search the length, and compare the fingerprints of the candidate prefixes. The cost is $O(\log n)$ per pair, with the same collision caveat.
- **Rabin-Karp with a sliding window.** When the ranges move by one position at a time, the fingerprint can be updated in $O(1)$ without the power table, which is the string version of the same idea.

## Contest strategy

1. Check the precondition: the array must be static. If the statement updates values, go to a segment tree of hashes instead.
2. Decide whether the question is about sequences or multisets. The polynomial hash answers sequences; a sum or XOR of labels answers multisets.
3. Fix the base and the modulus, and write them in the code as named constants. Use the same constants in every language if the answers have to agree.
4. Build the prefix table and the power table before reading the first query.
5. Compare lengths before fingerprints, and handle the empty range explicitly if the statement allows it.
6. Use unsigned 64-bit arithmetic, or mask explicitly in Python and JavaScript. Do not rely on signed overflow.
7. Test the three boundary ranges: the whole array, a single element, and a range that starts at the first position.
8. If the judge has hacks or the answer must be exact, use double hashing or verify each hash match with a direct comparison.

## Worked problems

### Problem 1: Finding Periods

**Restatement.** Given a string of length $n$, print every period length in increasing order. A period is a prefix that generates the whole string by repetition, and the last repetition may be partial. Constraints: $1 \le n \le 10^6$.

**Naive baseline.** For every candidate $p$, compare $s_i$ with $s_{i-p}$ for every $i \ge p$. The cost is $O(n^2)$ on a string of one repeated character.

**Insight.** The string has period $p$ exactly when the prefix of length $n - p$ equals the suffix that starts at position $p$. That is one range comparison, not a loop over every repeated block.

**Derivation.** Build the prefix fingerprints of the string and the powers of the base. For each $p$ from $1$ to $n$, compare the fingerprint of $[1, n-p]$ with the fingerprint of $[p+1, n]$. When $p = n$ the two ranges are empty and the comparison is trivially true. Print every $p$ that matches.

**Correctness.** The condition $s_i = s_{i-p}$ for all $i > p$ is equivalent to the first $n-p$ characters equaling the last $n-p$ characters, position by position. The fingerprint comparison tests that equality, up to a collision.

**Complexity.** $O(n)$ time and $O(n)$ space, because there are $n$ candidates and each costs one constant-time comparison.

**Common wrong approach.** Testing each repeated block separately. That is still $O(n \log n)$ after the harmonic sum, and it is easy to get the partial last block wrong; the single prefix-suffix comparison avoids both problems.

### Problem 2: ABCBAC

**Restatement.** Given $N$ and a string $T$ of length $2N$, find a string $S$ of length $N$ and a split $i$ such that $T$ is the first $i$ characters of $S$, followed by the reverse of $S$, followed by the last $N - i$ characters of $S$. Constraints: $1 \le N \le 10^6$.

**Naive baseline.** For every split $i$, build the candidate $S$ and the string $f_i(S)$, then compare it with $T$. Building and comparing costs $O(N)$ per split, so the total is $O(N^2)$.

**Insight.** For a fixed split, the candidate $S$ is determined by $T$: its first $i$ characters come from the front of $T$, and its last $N - i$ characters come from the back. The middle of $T$ must equal the reverse of $S$, and that is a range comparison.

**Derivation.** Build prefix hashes of $T$ and of the reversed $T$. For each split $i$, the candidate $S$ is the first $i$ characters of $T$ followed by its last $N - i$ characters; these are two ranges, not a copied string. The middle $N$ characters of $T$ must equal the reverse of $S$, which is the reverse of the second piece followed by the reverse of the first, so two range comparisons confirm the split. Each split costs $O(1)$.

**Correctness.** The construction of $f_i(S)$ is deterministic, so a split is feasible exactly when the candidate $S$ reproduces $T$ at every position. Each comparison is a range fingerprint, and equal content implies equal fingerprints.

**Complexity.** $O(N)$ time and $O(N)$ space for the hash tables.

**Common wrong approach.** Concatenating the candidate string at every split. The concatenation alone is $O(N^2)$ and exceeds the time limit long before the comparison does.

### Problem 3: Palindrome Query

**Restatement.** Maintain a string of length $N$ under point updates and answer queries that ask whether the substring from $L$ to $R$ is a palindrome. Constraints: $N \le 10^6$ and $Q \le 10^5$.

**Naive baseline.** For each palindrome query, compare the substring with its reverse, at a cost of $O(N)$ per query and $O(NQ)$ overall. A point update is $O(1)$.

**Insight.** A substring is a palindrome exactly when it equals its reverse. With a segment tree that stores the forward and reverse fingerprints of every segment, both the update and the comparison cost $O(\log N)$.

**Derivation.** Build two segment trees over the string: one stores the forward hash of each segment, the other the hash of the reversed segment. A point update changes one leaf and recomputes the hashes on the path to the root. A palindrome query compares the forward fingerprint of $[L, R]$ with the fingerprint of the mirrored range $[N - R + 1, N - L + 1]$ in the second tree.

**Correctness.** The forward fingerprint of the range is the hash of $s_L \ldots s_R$; the reverse tree's fingerprint of the same range is the hash of $s_R \ldots s_L$. The two are equal exactly when the substring is a palindrome, up to a collision.

**Complexity.** $O((N + Q) \log N)$ time and $O(N)$ space.

**Common wrong approach.** Keeping a static prefix table and rebuilding it after every update. Each rebuild is $O(N)$, so the updates alone cost $O(NQ)$.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for sequence equality, multiset equality, or a sum. Only the first calls for a polynomial range hash.
2. **Direct application.** Implement the two tables and the range formula for one-based queries, and check the answers against a direct comparison on small random arrays.
3. **Collision discipline.** Run the same tests with two different bases and confirm that every answer agrees. Then construct a small collision under a toy modulus and explain why it happens.
4. **Adaptation.** Use the hash for longest common prefix by binary search, and for palindrome checks with a reversed copy of the array.
5. **Combination.** Add point updates and move the fingerprints into a segment tree, then answer range equality in $O(\log n)$.
6. **Transfer.** Solve a pattern-matching problem with range hashing, then solve it again with KMP or Z-algorithm and compare the guarantees.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the prefix fingerprint store, and how does one multiply and add extend it? (Key insight)
2. Why is the earlier prefix multiplied by $B^{r-l+1}$ rather than by $B^{r-l}$? (Formal model)
3. Why do equal ranges always have equal fingerprints, and why does the converse fail? (Correctness proof)
4. What is the exact base and modulus used by the reference programs, and why are they fixed? (Reference implementations)
5. How much memory do the two tables use at $n = 10^6$, and why twice the prefix-sum table? (Complexity analysis)
6. Why must the C and C++ implementations use unsigned arithmetic? (Implementation walkthrough)
7. What happens to the tables when one value changes, and which structure fixes it? (Common mistakes)
8. When is a multiset fingerprint the right tool instead of a polynomial hash? (Algorithm selection)
9. How does the length check prevent a whole class of false matches? (Correctness proof)
10. How would double hashing change the cost and the collision probability? (Variants and extensions)

## Further reading

- The table that range hashing extends is [prefix sums](/algorithms/arrays/prefix-sums), which uses the same offset discipline with addition instead of multiplication.
- The string version, with prime moduli, double hashing, and substring queries, is [rolling hash](/algorithms/strings/rolling-hash).
- The structure to reach for when the array changes is the [segment tree](/algorithms/range-queries/segment-tree), and the [Fenwick tree](/algorithms/range-queries/fenwick-tree) handles the additive case.
- Deterministic pattern matching is covered by [KMP](/algorithms/strings/kmp) and the [Z-algorithm](/algorithms/strings/z-algorithm).
- Palindrome checks without hashing are covered by [Manacher's algorithm](/algorithms/strings/manacher).
- Range sums and their counting variants are in [subarray sums](/algorithms/arrays/subarray-sums).
