---
id: foundations.binary-representation
title: Binary representation
summary: Understand how a fixed-width integer stores a sign, how shifts and masks move bits around, and why a whole family of operations is constant time.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        binary representation,
        two's complement,
        bitwise operators,
        shifts,
        masks,
        bitmask,
        overflow,
        wraparound,
        bit manipulation,
    ]
prerequisites:
    required: [start.computational-foundations]
    recommended: [foundations.complexity]
complexity:
    time: "O(1) per word operation"
    space: "O(1)"
assumptions:
    - The integers under discussion have a fixed width, so that the set of bit patterns is finite and known.
    - The machine is binary, so that a machine word is a sequence of bits.
reviewed: false
---

## At a glance

An integer of fixed width is a sequence of bits, and almost everything interesting about bit manipulation follows from deciding how to use one bit to mean "negative". The scheme that won is **two's complement**, and the reason it won is that ordinary binary addition keeps working: the sign bit does not need any special case in the adder.

The consequences spread outward. Addition, subtraction, and negation all become bit operations. Shifts become multiplication and division by powers of two. Masks become field extraction, and with them a whole collection of operations that are constant time because they touch one machine word: testing a bit, swapping two values without a temporary, computing an absolute value without a branch, and asking whether a number is a power of two.

The traps are equally consistent. Signed overflow is undefined behavior in C and C++ and a silent wraparound in Java. A shift count that is too large is undefined behavior in C and C++ and a silent reduction modulo the width in Java. And the mask idiom, which is written the same way everywhere, needs the literal `1` to be widened exactly when the width crosses the type boundary.

## Problem motivation

A problem says: given a set of $n$ items, $n \le 20$, find the subset whose sum is $W$. Trying every subset takes $2^{20} \approx 10^6$ steps, which is fine. Trying every subset for $n = 40$ takes $10^{12}$ steps, which is not.

The difference is not the algorithm. The algorithm is the same loop over the same subsets. The difference is **how a subset is represented**.

If a subset is a list of its elements, then adding an element to a subset costs time proportional to the size of the subset, and the enumeration costs $O(n 2^n)$ in total. If a subset is a bitmask, then adding an element is one bitwise OR, testing membership is one bitwise AND, and the whole enumeration costs $O(2^n)$ mask operations.

That representation is the subject of this article, and it is used by [subset enumeration](/algorithms/enumeration/subset-enumeration), by [sorting](/algorithms/foundations/sorting) when the keys are fixed-width integers, and by a large family of constant-time tricks that are worth memorizing.

## Recognition patterns

Reach for bit manipulation when the problem mentions any of the following.

- **A small universe of possibilities.** "At most 20 items", "each flag is on or off", "there are 10 switches". When the state space is a power of two, a mask is the natural state.
- **A subset, a permutation, or a selection.** All three are sets of positions, and a mask names one in a fixed number of words.
- **A divisibility or parity question.** These are questions about the low bits, and the low bits are a mask.
- **A swap that must be constant time.** Two XORs and a third exchange the values without a temporary.
- **A packed record.** When several small fields share one integer, masks and shifts are how the fields are separated.

Reach for _not_ using bit manipulation when the problem is about arbitrary values, when the values are negative and the language's shift semantics are awkward, or when the language offers a wider integer type that removes the need for a trick at all. Python has arbitrary precision integers, so most of the width games in this article simply do not arise there.

## Naive approach

The baseline is to represent a set of flags as an array of booleans.

```cpp
bool on[20] = {false};
on[3] = true;
if (on[3]) { /* ... */ }
```

This is correct and clear, and it is the right choice when the number of flags is not small or when the problem is about the flags individually rather than about the set.

Its cost is the problem. Adding a flag is one store, but _combining_ two sets is a loop over the flags, and _testing_ whether one set is a subset of another is a loop. With a mask, all three are one operation.

The second baseline is to use division and multiplication by powers of two instead of shifts, and to use `x % 2` and `x / 2` for the low bit. This is equivalent for non-negative values and has the same cost, but it fails for negative values, where `/` rounds toward zero and a shift rounds toward negative infinity. The difference is not academic: `-7 / 2` is $-3$ and `-7 >> 1` is $-4$.

## Key insight

The insight is that **the position of a bit is a number**, and that a single machine word can therefore carry several small numbers at once, one per bit position, with the bitwise operators performing arithmetic on all of them simultaneously.

Two ideas make that concrete.

The first is that a fixed-width integer has a natural split into a sign and a magnitude. Two's complement makes the split invisible: the weight of the top bit is negative, so the same addition circuit handles signed and unsigned values, and the same comparison works.

The second is that a mask is a way of saying "these bits, and only these bits". Once masks exist, a field of a packed record is extracted by shifting the field down to the bottom and masking it off, and written back by clearing the field and inserting the new value.

Everything in this article is one of those two ideas applied.

## Formal model

Let $w$ be the width of the type in bits, and let the bit pattern of a value be $b_{w-1} b_{w-2} \dots b_0$, where each $b_i$ is $0$ or $1$.

::: math definition Definition
The **two's complement** value of the pattern $b_{w-1} \dots b_0$ is

$$
V = \sum_{i=0}^{w-2} b_i\,2^i \;-\; b_{w-1}\,2^{w-1}.
$$

The bit $b_{w-1}$ is the **sign bit**. The value of the pattern as an unsigned integer is $U = \sum_{i=0}^{w-1} b_i 2^i$, and the two are related by $V = U$ when $b_{w-1} = 0$ and $V = U - 2^w$ when $b_{w-1} = 1$.
:::


::: math definition Definition
The **low-$k$ mask** is the pattern whose lowest $k$ bits are $1$ and whose
other bits are $0$. The operation $x \mathbin{\&} m$ keeps the bits of $x$
that are $1$ in $m$ and clears the others.
:::


::: math lemma Lemma
The two's complement encoding is a bijection from the $2^w$ bit patterns
onto the integers in $[-2^{w-1},\; 2^{w-1}-1]$.
:::


::: math lemma Lemma
The sign bit of a two's complement pattern is $1$ if and only if the value
is negative.
:::


The lemma about the sign bit is the one that explains the representation. The weight of the top bit is negative, so a pattern with the top bit set has a value that is at most $(2^{w-1} - 1) - 2^{w-1} = -1$, and a pattern with the top bit clear has a value that is at least $0$. There is no pattern whose value is both, and no value in the range with two patterns.

## Algorithm derivation

### Why the sign bit works

The reason two's complement was adopted over the alternatives is that addition needs no special case.

Addition of two $w$-bit patterns is ordinary binary addition with the carry out of the top bit discarded, that is, addition modulo $2^w$. Under the two's complement reading, that is exactly signed addition. The complement-and-add-one identity makes it work: the pattern of $-x$ is $\sim x + 1$, and

$$
\sim x + 1 = (2^w - 1 - x) + 1 = 2^w - x \equiv -x \pmod{2^w}.
$$

So a negating adder is a complement plus an increment, and the same adder handles both signs. The alternative encodings, sign and magnitude and ones' complement, both need a special case for zero, and sign and magnitude needs a special case for carry at all.

### The ranges of the fixed-width types

| Type | Bits | Range |
| --- | --- | --- |
| signed 8-bit | 8 | $-128$ to $127$ |
| unsigned 8-bit | 8 | $0$ to $255$ |
| signed 32-bit (`int`) | 32 | $-2\,147\,483\,648$ to $2\,147\,483\,647$ |
| unsigned 32-bit | 32 | $0$ to $4\,294\,967\,295$ |
| signed 64-bit | 64 | $-9\,223\,372\,036\,854\,775\,808$ to $9\,223\,372\,036\,854\,775\,807$ |
| Python `int` | unbounded | no upper bound |
| JavaScript `Number` | 64 bits of double | exact integers only up to $2^{53}$ |

### Overflow is not the same everywhere

| Language   | Signed overflow                                      | Unsigned overflow           |
| ---------- | ---------------------------------------------------- | --------------------------- |
| C and C++  | undefined behavior                                   | defined, wraps modulo $2^w$ |
| Java       | defined, wraps modulo $2^w$                          | wraps modulo $2^w$          |
| Python     | impossible, arbitrary precision                      | impossible                  |
| JavaScript | the value is a double, so it loses precision instead | same                        |

In C and C++, signed overflow is undefined because the compiler is allowed to assume it cannot happen and to optimize accordingly; a program that overflows a signed `int` may print a different answer on a different compiler. Unsigned overflow is defined, because it is exactly the wraparound that bit manipulation relies on.

### Shifts, arithmetic and logical

A left shift by $k$ moves each bit $k$ positions toward the most significant end, which multiplies the value by $2^k$ as long as no significant bit is shifted out.

A right shift comes in two kinds. A **logical** right shift fills the vacated positions with zeros, and an **arithmetic** right shift fills them with copies of the sign bit.

| Language  | Right shift of a negative value                    | Shift count too large   |
| --------- | -------------------------------------------------- | ----------------------- |
| C and C++ | arithmetic in C++20, implementation-defined before | undefined behavior      |
| Java      | `>>` arithmetic, `>>>` logical                     | reduced modulo 32 or 64 |
| Python    | always arithmetic                                  | never an error          |

Two consequences matter in contests. In Java, `x >> 1` rounds toward negative infinity and `x / 2` rounds toward zero, so they differ for negative values. And in Java, `1 << 32` is `1`, because the shift count is reduced modulo 32.

### The mask idiom

Let $m_k = 2^k - 1$, the pattern with $k$ low bits set.

| Purpose | Expression | Result |
| --- | --- | --- |
| Keep the low $k$ bits | `x & m_k` | the low $k$ bits of $x$ |
| Keep the high bits | `x & ~m_k` | everything above the low $k$ bits |
| Extract a field of width $w$ at offset $o$ | `(x >> o) & m_w` | the field, moved to the bottom |
| Write a field of width $w$ at offset $o$ | `(x & ~(m_w << o)) \| (v << o)` | $x$ with the field replaced by $v$ |
| Test bit $i$ | `(x >> i) & 1` | $1$ if the bit is set |
| Set bit $i$ | `x \| (1 << i)` | $x$ with the bit set |
| Clear bit $i$ | `x & ~(1 << i)` | $x$ with the bit cleared |
| Toggle bit $i$ | `x ^ (1 << i)` | $x$ with the bit flipped |

The mask must be built at the right width. The literal `1` must be widened before it is shifted by the full width of the type, which is why the mask for 32 bits in C++ is `(1u << 32) - 1` and not `(1 << 32) - 1`.

### The operations that are constant time

Because the whole value lives in one machine word, each of these is one machine instruction or a fixed number of them, regardless of how large the number is.

| Question                           | Answer                                                |
| ---------------------------------- | ----------------------------------------------------- |
| Is $x$ odd?                        | `x & 1`                                               |
| Is $x$ a power of two?             | `x > 0 && (x & (x - 1)) == 0`                         |
| Clear the lowest set bit           | `x & (x - 1)`                                         |
| Isolate the lowest set bit         | `x & -x`                                              |
| Count the set bits                 | `Integer.bitCount(x)`, `x.bit_count()` in Python 3.10 |
| Is $a$ a subset of $b$?            | `(a & b) == a`                                        |
| Swap $a$ and $b$                   | `a ^= b; b ^= a; a ^= b;`                             |
| Absolute value of a 32-bit integer | `(x ^ (x >> 31)) - (x >> 31)`                         |
| Number of trailing zeros           | the position of the lowest set bit of `x & -x`        |

The power-of-two test is the clearest of these. A positive power of two has exactly one bit set, and subtracting one turns that single bit into a run of lower ones, so the AND of the two is zero. Conversely, any number with more than one bit set keeps at least one bit in common with its predecessor, so the AND is nonzero.

## Step-by-step execution

Take $x = 0b1011\,0110$, a byte, and extract the four-bit field that starts at bit position 2.

1. The field is bits $2$ to $5$, which are `1101` in the pattern `1011 0110`.
2. Shift right by 2: `0b1011 0110 >> 2` is `0b0010 1101`, which is `0x2D`.
3. Mask with the low-four mask `0b1111`: `0b0010 1101 & 0b0000 1111` is `0b0000 1101`, which is $13$.

To write the value $9 = 0b1001$ back into the same field:

1. Build the field mask: `0b1111 << 2` is `0b0011 1100`.
2. Clear it: `0b1011 0110 & ~0b0011 1100` is `0b1000 0010`.
3. Insert the value: `0b1000 0010 | (0b1001 << 2)` is `0b1000 0010 | 0b0010 0100` is `0b1010 0110`.

The other bits are untouched, and the field now reads `1001`.

## Correctness proof

::: math theorem Theorem
The two's complement encoding maps the $2^w$ patterns of a $w$-bit type
bijectively onto the integers in $[-2^{w-1},\; 2^{w-1}-1]$.
:::


::: math proof Proof
**Surjectivity.** Let $v$ be an integer in the range. If $v \ge 0$, write
$v$ in binary using at most $w-1$ bits and set the top bit to $0$; the
definition then gives $V = v$. If $v < 0$, write $-v$ in binary using at
most $w-1$ bits, complement every bit, and add one. By the identity
$\sim x + 1 \equiv -x \pmod{2^w}$ derived above, the resulting pattern has
value $-v$ as an unsigned integer, that is $2^w + v$, and since its top bit
is $1$ its two's complement value is $2^w + v - 2^w = v$. So every value
in the range has a pattern.

**Injectivity.** Suppose two patterns have the same value. If they have the same top bit, they represent the same unsigned integer, and the binary representation of an unsigned integer is unique, so the patterns are equal. If their top bits differ, one value is negative and the other is not, so they cannot be equal. Therefore distinct patterns have distinct values.

There are $2^w$ patterns and exactly $2^w$ integers in the range, and the encoding is a bijection. $\square$
:::


::: math theorem Theorem
For a $w$-bit unsigned value $x$ and a field of width $f$ starting at bit
position $o$, the expression `(x >> o) & ((1 << f) - 1)` is the value of
that field, and the expression `(x & ~(((1 << f) - 1) << o)) | (v << o)`
replaces that field with $v$ and leaves every other bit of $x$ unchanged.
:::


::: math proof Proof
A right shift by $o$ moves the bit at position $o + k$ to position $k$ and
discards the bits at positions below $o$. The bits that were at positions
$o$ through $o + f - 1$ are therefore now at positions $0$ through $f - 1$,
and every bit above them is at position $f$ or higher.

The mask $(1 << f) - 1$ has its low $f$ bits set and all others clear. The bitwise AND of a value with that mask keeps exactly the low $f$ bits and clears everything above them. Applied to the shifted value, this keeps exactly the field bits and discards the rest. The first expression is therefore the field.

For the second, the mask $((1 << f) - 1) << o$ has ones exactly in the field positions and zeros elsewhere. Its complement has zeros in the field positions and ones everywhere else, so `x & ~mask` clears the field and preserves every other bit of $x$. The value `v << o` has the bits of $v$ in the field positions and zeros elsewhere, provided $v < 2^f$; the bitwise OR of the two therefore sets the field to $v$ and disturbs nothing else. $\square$
:::


## Complexity analysis

Every operation described in this article touches a single machine word, so every one of them costs $O(1)$ time and $O(1)$ space, **provided the values fit in one word**.

That proviso is the whole story. The moment a value does not fit, the arithmetic changes character:

| Value                | Addition | Multiplication |
| -------------------- | -------- | -------------- |
| one 32-bit word      | $O(1)$   | $O(1)$         |
| one 64-bit word      | $O(1)$   | $O(1)$         |
| $b$ bits, schoolbook | $O(b)$   | $O(b^2)$       |

So a mask over 64 bits costs the same as a mask over 8 bits, but a mask over a 64-bit _array_ costs 64 times as much, and Python's arbitrary precision integers cost one operation per 30 bits of limb.

The complexity of a bitmask algorithm is therefore usually stated as $O(2^n)$ for the enumeration and $O(n 2^n)$ for materializing each subset, and the constant factor is the width of the mask.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| A set of at most 64 flags | A single 64-bit mask |
| A set of at most 20 items to enumerate | A 32-bit mask, $2^{20}$ subsets |
| A set of items whose count is unbounded | A set of indices, or a bitset of blocks |
| A packed record of small fields | Masks and shifts |
| A value that does not fit in a word | A big integer, and a different algorithm |
| A value that is negative and needs halving | Divide, or shift with the language's semantics in mind |

## Recursion decision

Bit tricks are almost never recursive, and the one place recursion appears is in the enumeration of masks themselves. Enumerating all $2^n$ masks recursively, by either including or excluding the next bit, costs $2^{n+1}$ calls and a depth of $n$. That depth is $O(\log n)$ for the usual algorithms only if the recursion is over the _value_, not over the number of bits, so in practice the enumeration is a loop over integers from $0$ to $2^n - 1$, which is both faster and shallower.

The recursion rule from [recursion](/algorithms/foundations/recursion) applies to any helper you write around these tricks: a recursive routine that enumerates the subsets of a set of $n$ items has depth $n$, and $n = 40$ will overflow the stack of a language whose limit is $10^4$ frames.

## Implementation walkthrough

Three lines carry most of the value.

The mask, built at the right width:

```cpp
constexpr uint64_t MASK_32 = (1ULL << 32) - 1;   // 1ULL, because 1 is 32 bits
```

The subset test, which is the operation that makes a mask worth having:

```cpp
if ((have & need) == need) { /* every wanted flag is present */ }
```

The swap without a temporary, which is the operation that makes a mask worth having twice:

```cpp
std::swap(a, b);        // three moves through a temporary
a ^= b; b ^= a; a ^= b; // three XORs, no temporary
```

Both of the last two need the values to be of an integral type wide enough for the mask to live in. A mask over 64 flags does not fit in a 32-bit `int`, and the failure is the one described in the common mistakes table.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| `1 << 32` in C++ with an `int` literal | Undefined behavior | Use `1ULL << 32` |
| `1 << 32` in Java | The shift count is reduced modulo 32, so the result is $1$ | Use `1L << 32` |
| `(1 << n) - 1` as a mask for $n = 32$ | The mask is $0$ in Java, and undefined in C++ | Use a 64-bit literal for masks of 32 bits |
| Shifting a negative value left in C++ | Undefined behavior before C++20 | Use multiplication, or a signed-safe form |
| Using `>>` on a negative value and expecting truncation | The result rounds toward negative infinity | Divide instead, or use `>>>` in Java |
| Treating signed overflow as wraparound | Undefined behavior in C and C++ | Use unsigned types, or check the range |
| Building a mask from a signed `1 - (1 << k)` | Overflow for $k = 31$ | Build from the unsigned type |
| Using a mask wider than the type | The high bits are lost | Size the mask to the type |

### Why this fails: the mask that is one bit too wide

The plausible wrong approach is to write the mask idiom exactly as it is written in books, with an `int` literal, and to use it for any width the problem happens to need.

The smallest counterexample is a set of $32$ items and the mask that selects the low 32 bits.

```java
int mask = (1 << 32) - 1;
```

In Java, the shift count in `1 << 32` is reduced modulo the width of the type, so `1 << 32` is `1 << 0`, which is $1$. The mask is therefore $1 - 1 = 0$, and every subsequent masked value is $0$. The program does not crash. It reports that no subset has any element in it, or that every subset has all of them, or whatever the zero mask implies, and it does so confidently. The identical expression in C++ is undefined behavior, since the shift count is not less than the width of the promoted left operand.

The smallest correct version uses a 64-bit literal:

```java
long mask = (1L << 32) - 1;   // 4294967295
```

The same failure appears one step down. A mask of the low 31 bits written as `(1 << 31) - 1` is undefined behavior in C++, because `1 << 31` does not fit in a signed 32-bit `int`. In Java it happens to work, because the value wraps to `Integer.MIN_VALUE` and the subtraction then produces $2\,147\,483\,647$, which is the right mask. A program that is correct in one language and undefined in another is a program that will eventually fail on the wrong judge.

The lesson generalizes: **the mask idiom has a fixed width, and the width of the literal is part of the idiom.**

## Variants and extensions

- **Bit fields with mixed widths.** A 32-bit word can hold a 3-bit field, a 5-bit field, and a 24-bit field, as long as the offsets and masks are written down.
- **Gray codes.** A Gray code of $n$ bits has the property that consecutive codes differ in exactly one bit, which makes it the right encoding for a counter that changes one bit at a time, such as a mechanical rotary encoder.
- **Bit-parallel comparison.** Storing $w$ booleans in the bits of one word lets a comparison test all of them with one AND and one comparison, which is how bitset implementations of set operations achieve their speed.
- **Population count.** Counting the set bits of a word is a single instruction on many processors, and a table lookup or the clear-the-lowest-bit loop elsewhere.
- **Modular arithmetic in unsigned types.** Unsigned addition and multiplication are exactly arithmetic modulo $2^w$, which is the basis of the hashing and rolling-hash techniques.

## Contest strategy

1. Check the width before writing the mask. Write the literal in the widest type the mask needs, and write the width in a comment.
2. Prefer unsigned types for bit manipulation. Unsigned arithmetic is defined, and the range is twice as large.
3. Use shifts only on non-negative values when the language's shift semantics are uncertain.
4. When the language has a built-in bitset or a set type with a good implementation, use it. The Python `int` is an arbitrary precision bitset, and `x & ~y`, `x | y`, and `x.bit_count()` are already there.
5. Test the boundary. A mask that works for 20 items and fails for 32 is the classic failure, and it is invisible in the small cases.
6. Do the arithmetic in 64 bits and the counting in 64 bits. A count of pairs or subsets overflows 32 bits long before the algorithm has a chance to be interesting.

## Worked problems

### Problem 1: subsets with a given sum

**Restatement.** Given $n \le 40$ integers and a target $W$, report whether some subset sums to $W$.

**Naive baseline.** Enumerate all $2^{40}$ subsets, which is about $10^{12}$ iterations.

**Insight.** A subset fits in a 64-bit mask when $n \le 64$, so enumerating subsets is a loop over integers.

**Derivation.** Meet in the middle: split the items into two halves, enumerate the $2^{20}$ subset sums of each half, store one half in a hash set, and look up the complement for each subset of the other half.

**Correctness.** Every subset is a union of a left subset and a right subset, and the two halves are each enumerated exactly once.

**Complexity.** $O(2^{n/2})$ expected time and $O(2^{n/2})$ space.

**Common wrong approach.** Enumerating all $2^{40}$ subsets, or using a 32-bit mask for the 40 items, which silently overflows in Java.

### Problem 2: the parity of a permutation

**Restatement.** Given a permutation of $n \le 10^5$ elements, report whether it is even or odd as a permutation.

**Naive baseline.** Count the inversions with a merge sort, which costs $O(n \log n)$.

**Insight.** The parity of a permutation is the parity of its number of inversions, and the parity of the number of transpositions is the parity of the number of swaps, and a cycle of length $k$ is $k - 1$ swaps.

**Derivation.** Decompose the permutation into cycles and accumulate $\sum (k - 1)$ over the cycles.

**Correctness.** Each cycle of length $k$ is exactly $k - 1$ transpositions, and transpositions change the parity, so the parity of the total is the parity of the inversion count.

**Complexity.** $O(n)$ time and $O(n)$ space for the visited array.

**Common wrong approach.** Using the low bit of a counter to decide parity, which is only valid because the parity of a permutation is a single bit of information and not because of anything about the machine.

### Problem 3: a subset of a multiset

**Restatement.** Given $n \le 20$ items, count the subsets whose sum is $W$, counting each choice of positions separately.

**Naive baseline.** Enumerate the $2^n$ subsets and test each sum, which costs $O(n 2^n)$.

**Insight.** With the items sorted, the subsets can be enumerated in non-decreasing sum order by a recursive expansion, which lets the search stop early.

**Derivation.** Enumerate the subsets of each prefix and keep the counts in a dynamic program indexed by the sum.

**Correctness.** The dynamic program counts each subset once, because each subset of the first $i$ items is either the subset of the first $i - 1$ items without item $i$ or with it.

**Complexity.** $O(nW)$ time and $O(W)$ space.

**Common wrong approach.** Treating the items as a set when the statement counts positions, so that two equal items produce one subset instead of two.

## Practice progression

1. **Recognition.** Given a problem, decide whether a mask is a natural representation and whether it fits in one word.
2. **Direct application.** Convert between decimal, hexadecimal, and binary, and compute the two's complement of a negative number by hand.
3. **Adaptation.** Extract and write back a packed field, and verify the other bits are untouched.
4. **Combination.** Combine a mask with a hash set to count the subsets that satisfy a condition, and with a prefix sum to count the subsets with a given sum.
5. **Challenge.** Write a bit-parallel version of a set operation on two sets of 64 flags and verify it against a straightforward one.
6. **Transfer.** Find a problem where the representation, rather than the algorithm, is the hard part, and design the representation first.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. Give the two's complement value of a bit pattern, and explain why the top bit is the sign bit. (Formal model)
2. State the range of a signed 32-bit and an unsigned 32-bit integer. (Algorithm derivation)
3. Say what happens on signed overflow in C++, in Java, and in Python, and why the answers differ. (Algorithm derivation)
4. What is the difference between an arithmetic and a logical right shift, and which languages provide each? (Algorithm derivation)
5. Give the expression for the low-$k$ mask, the high-$k$ mask, and the extraction of a field. (Algorithm derivation)
6. Explain why the mask `(1 << 32) - 1` is $0$ in Java and undefined in C++. (Common mistakes)
7. Give the power-of-two test and explain why it works. (Algorithm derivation)
8. Name four operations that are constant time because of the representation, and say what the proviso is. (Complexity analysis)
9. Why does $-7 / 2$ differ from $-7 >> 1$, and which one rounds toward negative infinity? (Algorithm derivation)
10. When does the width of the literal matter, and what is the smallest case in which it matters? (Common mistakes)

## Further reading

- The machine model that gives integers their width, and the memory model that goes with it, is in [computational foundations](/start/from-ap-csa/part-1-computational-foundations).
- The enumeration that a mask makes possible, and the meet in the middle split that saves it, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The non-comparison sorts that depend on fixed-width keys are in [sorting](/algorithms/foundations/sorting).
- The bounds that decide whether an exponential enumeration is affordable are in [complexity analysis](/algorithms/foundations/complexity).
