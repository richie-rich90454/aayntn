---
id: dynamic-programming.digit-dp
title: Digit dynamic programming
summary: Count the integers in a range that satisfy a condition on their decimal digits, by processing the digits from the most significant one and remembering only what the remaining digits can still depend on.
division: [gold, platinum]
subjects: [dynamic-programming]
level: advanced
importance: advanced-technique
keywords:
    [
        digit dp,
        digit dynamic programming,
        leading zeros,
        tight flag,
        digit sum,
        number of digits,
        count within a range,
    ]
prerequisites:
    required: [foundations.complexity, foundations.recursion]
    recommended:
        [
            dynamic-programming.0-1-knapsack,
            number-theory.modular-arithmetic,
            start.discrete-mathematics,
        ]
complexity:
    time: "O(D * S * b)"
    space: "O(D * S)"
assumptions:
    - The condition to be counted is expressible on the decimal digits of a number read from the most significant digit to the least significant one.
    - The bound is small enough to be held in a machine word, or is supplied as a digit string so that its length, rather than its value, is the limit.
    - The count is reported exactly, or the modulus of the report is applied to every addition.
reviewed: false
---

## At a glance

Digit dynamic programming counts numbers whose **digits** satisfy a condition. The canonical problems are "how many integers in $[A, B]$ have digit sum $K$", "how many have no digit equal to $4$", and "how many are divisible by $D$".

The whole technique is a dynamic program whose position is the index of a digit, and whose other state is whatever the condition accumulates. There are exactly two positions in the state that are not about the condition:

- the **tight flag**, which records whether the digits chosen so far are still identical to the bound's prefix, and
- the **started flag**, which records whether the number has begun, so that a leading zero is not mistaken for a digit of the number.

The cost is $O(D \cdot S \cdot 10)$ time and $O(D \cdot S)$ space, where $D$ is the number of digits of the bound and $S$ is the size of the accumulated state. For a 64-bit bound, $D \le 19$, so the program is tiny.

The technique is easy to state and easy to get wrong. Nearly every failure comes from one of two places: the leading zero, and the boundary of the range.

## Problem motivation

A statistics agency wants to know how many social security numbers, written without a leading dash, contain no digit `0` and have a digit sum of $27$.

The numbers run from $000$-$00$-$0000$ to $999$-$99$-$9999$. The set has $10^{12}$ members, so enumerating them is out of the question, and no amount of caching helps because there are $10^{12}$ distinct states. The agency needs a count, and it needs the count in well under a second.

What makes the problem tractable is that the condition is stated **on the digits**. Reading a number from the left, the only things that matter about the prefix are:

1. how many digits have been read,
2. the digit sum accumulated so far,
3. whether the prefix is still equal to the bound's prefix, which decides whether the next digit may exceed the bound's next digit,
4. whether the number has started at all, which decides whether a zero is a real digit.

Everything else is a restatement of those four facts. A dynamic program over that state has at most $19 \cdot 28 \cdot 2 \cdot 2$ states, and each state has ten transitions.

The same argument covers the more common contest versions. "How many integers in $[1, 10^{18}]$ are divisible by $13$?" accumulates a remainder instead of a sum. "How many integers in $[1, 10^{18}]$ contain the substring `7`?" accumulates a two-state flag saying whether the previous digit was a `7`. The shape of the program never changes; only the accumulated state does.

## Recognition patterns

Digit dynamic programming is the right tool when all of the following hold.

- The input is a **bound on a number**, written in decimal, and the answer is a **count** of numbers inside the bound that satisfy a condition.
- The condition is stated **on the digits**: on the digit sum, on the presence or absence of a digit, on the number of digits, on the parity of a digit sum, on the remainder modulo a number, or on a pattern inside the digit string.
- The bound has **many digits**, so that enumerating the numbers is impossible. Usually the bound is a 64-bit integer, so it has at most $19$ digits.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| The bound is at most $10^9$ | Enumeration is $10^9$ steps, which is already too slow; the technique is required |
| The bound is at most $10^{18}$ | Enumeration is impossible; the technique is required |
| The bound is a string of $10^5$ digits | The technique still works, but the state must be linear in the bound's length |
| The bound is at most $10^5$ | Enumeration is often acceptable, and the technique may be overkill |
| The condition is on the number's value, not its digits | A different technique; a factorization or a divisibility rule is what applies |
| The question asks for the list, not the count | Digit dynamic programming counts; it does not enumerate the answers |
| The condition is on the bits | The same program with a base of $2$ instead of $10$ |

The last two rows are the ones that catch people. "How many numbers satisfy the condition" is a counting problem. "List every number that satisfies the condition" is a different problem, and when the count is $10^{12}$ the second question has no answer that fits in memory.

A useful signal in a statement is the word **digits**, or the word **decimal**. A bound written as $10^{18}$ rather than as a concrete number is also a signal, because it says the bound is a power of ten and that the answer must be a formula or a program rather than a hand computation.

## Naive approach

The baseline enumerates the numbers in the range and tests each one.

```python
def count_by_enumeration(lo, hi, condition):
    total = 0
    for value in range(lo, hi + 1):
        if condition(str(value)):
            total += 1
    return total
```

This is correct, and it is the reference implementation for the differential test. Its problem is the loop: at $B = 10^{18}$ it performs $10^{18}$ iterations.

The second baseline is the one that is worth naming, because it is the mistake that the technique exists to remove. It is a recursive search over the digits with no memoization.

```python
def count_by_search(lo, hi, condition):
    def walk(pos, value):
        if pos == len(hi):
            return 1 if condition(value) else 0
        total = 0
        for digit in range(10):
            total += walk(pos + 1, value * 10 + digit)
        return total
    return walk(0, 0)
```

Without memoization this explores every digit string of length $D$, which is $10^D$ leaves, and it is wrong in a second way besides: it ignores the bound entirely. Both faults have the same cure, which is to remember what has been computed.

## Key insight

The insight is that **the count of completions of a digit prefix depends only on a small summary of that prefix, not on the prefix itself**.

Concretely, take the condition "the digit sum is $K$". Two prefixes `123` and `789` have different digit sums, so they lead to different continuations. But two prefixes with the same digit sum, the same position, the same tightness, and the same started status have exactly the same number of completions. The reason is that the condition only ever looks at the digits, and everything the condition needs to know about the past is exactly what the summary carries.

The same statement holds for every condition of this kind, and it is the reason the technique is a dynamic program rather than a search. The condition induces a **finite automaton** on the digits, and the dynamic program is the product of that automaton with the position.

The second half of the insight is about the bound. A number is at most $B$ exactly when, at the first position where it differs from $B$, its digit is smaller than the corresponding digit of $B$. So while the prefix is still equal to $B$'s prefix, the next digit is bounded by $B$'s next digit; once it is smaller, every remaining digit is free. That is what the tight flag records, and it is why the program does not need to test the whole number against $B$ at the end.

## Formal model

Let $B$ be a bound, and write its decimal representation as $d_0 d_1 \cdots d_{D-1}$, so that $B = \sum_{i=0}^{D-1} d_i \cdot 10^{D-1-i}$. Let $C$ be a condition on a digit string.

::: math definition Definition
A digit string $s = s_0 s_1 \cdots s_{D-1}$ **represents** the number $\operatorname{val}(s) = \sum_{i=0}^{D-1} s_i \cdot 10^{D-1-i}$. A string is **canonical** for its value if it has no leading zero, unless the value is zero, in which case the canonical string is `0`.
:::

::: math definition Definition
A digit string $s$ is **bounded by** $B$ if, letting $k$ be the first index with $s_k \ne d_k$, either no such index exists, or $s_k < d_k$. The **tight flag** of a prefix $s_0 \cdots s_i$ is true when $s_0 s_1 \cdots s_i = d_0 d_1 \cdots d_i$, and false otherwise.
:::

::: math definition Definition
The **started flag** of a prefix is false while every digit of the prefix is zero, and true once a nonzero digit has appeared. The started flag is what distinguishes the canonical representation of $2$, which is `2`, from the padded representation `002`.
:::

::: math definition Definition
Let $A$ be an accumulator over the digits read so far, with an update rule $A' = A \oplus c$ where $c$ is a contribution of the digit just read. The accumulator is **sufficient** for a condition $C$ if two prefixes with the same position, the same tight flag, the same started flag, and the same accumulator value have the same number of completions that satisfy $C$.
:::

::: math lemma Lemma
The accumulator is sufficient for every condition that is stated as a predicate over the digits, the running digit sum, the running remainder, the running count of occurrences of a pattern, or any finite combination of these.
:::

::: math proof Proof
Such a condition is a predicate over the sequence of digits read so far and the digits yet to come, and it reads the past only through the statistics it names. Two prefixes with equal statistics therefore satisfy the same predicates about the same continuations, so each continuation contributes to both counts equally, and the totals agree. $\square$
:::

## Algorithm derivation

The state is a four-tuple $(i, A, t, s)$, where:

- $i$ is the position, the number of digits read so far, with $0 \le i \le D$,
- $A$ is the accumulator,
- $t$ is the tight flag,
- $s$ is the started flag.

Let $F(i, A, t, s)$ be the number of ways to finish the number, reading digits at positions $i, i+1, \ldots, D-1$, so that the whole number is bounded by $B$ and satisfies $C$.

The base case is $F(D, A, t, s) = 1$ when the final condition holds and $0$ otherwise. The final condition is the one that cannot be expressed by the accumulator alone, such as "the number must be greater than zero", and it is checked exactly once, at the end.

The transition chooses the next digit $e$. The largest digit allowed is $d_i$ when $t$ is true, and $9$ otherwise, so

$$
L(i, t) = \begin{cases}
d_i & \text{if } t \text{ is true}, \\
9 & \text{otherwise}.
\end{cases}
$$

For every $e$ with $0 \le e \le L(i, t)$:

- the new tight flag is $t \wedge (e = d_i)$,
- the new started flag is $s \vee (e \ne 0)$,
- the new accumulator is $A \oplus c(e, s)$, where the contribution $c$ may depend on whether the number had already started. This is the entire leading-zero mechanism: when $s$ is false and $e = 0$, the digit is a padding zero and contributes nothing.

::: math recurrence Recurrence
$$
F(i, A, t, s) = \sum_{e=0}^{L(i,t)} F\bigl(i+1,\; A \oplus c(e,s),\; t \wedge (e = d_i),\; s \vee (e \ne 0)\bigr).
$$
:::

::: math invariant Invariant
At the moment the program is about to read the digit at position $i$, the state $(A, t, s)$ describes every prefix that has been read, and every prefix with that state has exactly the same number of completions. The program therefore never has to keep more than the state, and every number that satisfies the condition is counted on exactly one path through the state graph.
:::

### The two ways to handle the leading zero

There are two correct approaches, and they are worth knowing apart because they generalize differently.

**The started flag.** The state carries one more bit, and the contribution of a digit depends on it. This is the most flexible form, and it is the one to use when the condition can be stated on the digit string itself, such as "contains exactly one zero".

**Summing over lengths.** The program is run separately for each length $\ell$ from $1$ to $D$, with the first digit constrained to be nonzero, and the results are added. This removes the started flag entirely, at the cost of running the program $D$ times. It is the right form when the condition is additive over the digits, such as a digit sum, because then the contribution of a digit does not depend on the context.

The form that is **not** correct is padding every number to the width of the bound and applying the condition to the padded string. The next section gives the counterexample.

## Step-by-step execution

Count the integers in $[0, 99]$ whose digit sum is $9$. The bound is the two-digit string `99`, so $D = 2$, $d_0 = 9$, $d_1 = 9$, and the accumulator is the running digit sum.

The program is run in the forward direction, and the table below records the state after each position.

After position $0$, the first digit has been chosen:

| First digit | Accumulator | Tight flag | Started flag | Count    |
| ----------- | ----------- | ---------- | ------------ | -------- |
| 0           | 0           | false      | false        | 1        |
| 1           | 1           | false      | true         | 1        |
| 2           | 2           | false      | true         | 1        |
| $\vdots$    | $\vdots$    | $\vdots$   | $\vdots$     | $\vdots$ |
| 8           | 8           | false      | true         | 1        |
| 9           | 9           | true       | true         | 1        |

Every choice below $9$ leaves the prefix strictly below the bound, so the tight flag becomes false and the second digit is unconstrained. The choice $9$ keeps it tight, so the second digit is bounded by $9$, which is also unconstrained in practice, but the flag must still be tracked.

At position $1$ the second digit is chosen, and the counts of the states that end with an accumulator of $9$ are:

| Source prefix | Tight    | Allowed digits | Digits giving an accumulator of 9 | Count    |
| ------------- | -------- | -------------- | --------------------------------- | -------- |
| `0`           | false    | 0 to 9         | 9                                 | 1        |
| `1`           | false    | 0 to 9         | 8                                 | 1        |
| `2`           | false    | 0 to 9         | 7                                 | 1        |
| $\vdots$      | $\vdots$ | $\vdots$       | $\vdots$                          | $\vdots$ |
| `8`           | false    | 0 to 9         | 1                                 | 1        |
| `9`           | true     | 0 to 9         | 0                                 | 1        |

Ten prefixes reach an accumulator of $9$, so the answer is $10$. The numbers are $9, 18, 27, 36, 45, 54, 63, 72, 81, 90$, which is exactly right.

Notice the last row. The prefix `9` is tight, and the second digit must be at most $9$, which it is, so the number $90$ is inside the bound. Had the bound been $89$ instead, that row would contribute nothing at all: the digit $9$ is greater than the bound's first digit $8$, so the tight flag would have become false at position $0$ and the digit $9$ would never have been chosen. The tight flag is what prevents the program from ever choosing a digit that puts the number above the bound.

## Correctness proof

::: math theorem Theorem
$F(0, A_0, \text{true}, \text{false})$ is the number of integers in $[0, B]$ whose digits satisfy $C$.
:::

::: math proof Proof
The proof has three parts: that the program counts only valid numbers, that it counts every valid number, and that it counts each one exactly once.

**Only valid numbers are counted.** Consider a path through the state graph that ends at a terminal state with the final condition satisfied. It reads a digit string $s$ of length $D$. The tight flag is true at position $i$ only while $s_0 \cdots s_{i-1} = d_0 \cdots d_{i-1}$. When the flag is true, the chosen digit is at most $d_i$, so at the first position $k$ where $s_k \ne d_k$ we have $s_k < d_k$. Hence $s$ is bounded by $B$ in the sense of the definition, so $\operatorname{val}(s) \le B$.

The started flag is false exactly while every digit read is zero, so the string is a padding of zeros followed by a canonical representation, and $\operatorname{val}(s)$ is a number in $[0, B]$. The final condition is checked once, at the terminal state, and the path contributes $1$ only if it holds. Therefore every counted path contributes a number in $[0, B]$ that satisfies $C$.

**Every valid number is counted.** Let $n$ be a number in $[0, B]$ that satisfies $C$, and let $s$ be its canonical representation, padded with leading zeros to length $D$. Follow the path that reads exactly these digits. At each position the digit is legal: while the prefix is tight, the digit is a digit of $n$ and $n \le B$ forces it to be at most $d_i$; once the prefix is below the bound, every digit is legal. The accumulator ends at the value that encodes the condition, and the final condition holds because $n$ satisfies $C$. So the path reaches a terminal state that contributes $1$.

**Each number is counted once.** The path that reads $s$ is uniquely determined by $s$, and two different numbers have different canonical representations, hence different paths. Therefore every valid number contributes exactly $1$ and no other path contributes. $\square$
:::

::: math lemma Lemma
The four parts of the state are sufficient: the position, the accumulator, the tight flag, and the started flag determine the number of completions.
:::

::: math proof Proof
Every path leaving a state reads a digit string of the remaining length. The set of legal digit strings depends only on the tight flag, because the tight flag determines the allowed range of the next digit and, once it becomes false, the flag never becomes true again, so the rest of the string is unconstrained. The started flag determines whether the digits read so far contributed to the accumulator, which matters only for the condition "exactly one zero" and for a count of the digits, and it also determines whether the number is zero. The accumulator carries the rest of the condition, by the sufficiency lemma. The position determines how many digits remain. Hence two states with equal components have equal numbers of accepting continuations, and the program may merge them. $\square$
:::

## Complexity analysis

Let $D$ be the number of digits of the bound, let $S$ be the number of distinct accumulator values, and let $b$ be the base, which is $10$ for decimal digits.

| Quantity                    | Cost                           |
| --------------------------- | ------------------------------ |
| States                      | $O(D \cdot S \cdot 2 \cdot 2)$ |
| Transitions per state       | $O(b)$                         |
| Time                        | $O(D \cdot S \cdot b)$         |
| Space, memoized             | $O(D \cdot S)$                 |
| Space, with a rolling array | $O(S)$                         |

The accumulator determines $S$:

| Accumulator                | $S$      | Example problem            |
| -------------------------- | -------- | -------------------------- |
| Digit sum                  | $9D + 1$ | Digit sum equals $K$       |
| Remainder modulo $D$       | $D$      | Divisible by $D$           |
| Count of a forbidden digit | $D + 1$  | Contains no digit $4$      |
| Two-state pattern flag     | $2$      | Contains the substring `7` |
| Digit sum, clipped at $K$  | $K + 1$  | Digit sum at most $K$      |

For a 64-bit bound, $D \le 19$, so the digit-sum accumulator has at most $172$ values and the whole program has a few thousand states. The constant factor of $10$ for the digit loop is the only thing that matters in practice, and it is why a forward rolling-array implementation is the fastest form.

Counting a range is two calls, one for $B$ and one for $A-1$, so the total cost is twice the cost of a single call. Counting the numbers in $[0, B]$ that do **not** satisfy the condition and subtracting is the same cost and is sometimes easier to get right, because the complement of a condition on the digits is often easier to accumulate.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| Count numbers in a range by a condition on their digits | Digit dynamic programming |
| Count numbers with a given digit sum | Digit dynamic programming with a sum accumulator |
| Count numbers divisible by $D$ in a range | Digit dynamic programming with a remainder accumulator |
| Count numbers with no forbidden digit | Digit dynamic programming with a flag accumulator |
| Count numbers with exactly $k$ digits | Digit dynamic programming, or the length formulation |
| Count numbers whose digits are a permutation of a multiset | A factorial and a divisibility count, not this technique |
| List the numbers that satisfy the condition | Enumeration, if there are few enough of them |
| Count numbers in a range by a condition on the number's value | A different technique entirely |
| The bound is small, at most $10^6$ | Enumeration is often simpler and fast enough |
| The condition is on the binary digits | The same program with a base of $2$ |

The third row of the constraint table in the recognition section is worth repeating here: a condition on the number's value, such as "is a perfect square", is not a digit condition, and the digit program cannot express it.

## Recursion decision

The natural formulation of this program is recursive: $F$ calls $F$ on the next position. The recursion depth is exactly $D$, the number of digits of the bound.

For a bound held in a 64-bit integer, $D \le 19$. A depth of $19$ is safe in every language, including Python, whose default interpreter limit is $1000$. In that case the memoized recursive form is the right choice, because it is the shorter code and because the memo table is indexed by the same state tuple that the recursive function takes.

For a bound supplied as a string of $10^5$ digits, the depth becomes $10^5$, and the situation changes.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Iterative when $D$ is large |
| Java | About $10^4$ frames | Iterative when $D$ is large |
| Python | The interpreter limit of $1000$ | Iterative; the recursive form overflows for $D > 1000$ |
| Pascal | The operating system stack | Iterative when $D$ is large |
| JavaScript | About $10^4$ frames | Iterative when $D$ is large |

The rolling-array form is not harder to write. It keeps two arrays of size $S$, one for the tight states and one for the loose states, and it sweeps the positions from left to right. The recommendation is therefore: use the recursive memoized form when $D \le 20$, and the rolling form otherwise.

## Implementation walkthrough

The leading-zero contribution is the line that matters, and it is the line that is easiest to get wrong.

```cpp
// The contribution of a digit depends on whether the number has started.
long long contribution(int digit, bool started) {
    if (!started && digit == 0) return 0;   // a padding zero is not a digit
    return digit;
}
```

A digit sum that adds the digit unconditionally is correct only for the length formulation, where the first digit is separately constrained to be nonzero. In the started-flag formulation it is wrong, because it counts the padding zeros.

The transition is the second line that matters.

```cpp
for (int digit = 0; digit <= limit; ++digit) {
    bool next_tight = tight && (digit == bound[pos]);
    bool next_started = started || (digit != 0);
    total += solve(pos + 1, acc + contribution(digit, started), next_tight, next_started);
}
```

The order of the two flag updates is not interchangeable with the accumulator update. The contribution uses the **old** `started` flag, not the new one, because the new flag says whether the number has started _after_ this digit, while the question is whether it had started _before_ it.

The boundary of the range is the third detail.

```cpp
long long countUpTo(long long bound) {
    if (bound < 0) return 0;   // the range may start at zero
    return solve(0, 0, true, false);
}
// the answer for [lo, hi] is countUpTo(hi) - countUpTo(lo - 1)
```

The `bound < 0` guard is not optional when the range starts at zero, because `lo - 1` is then $-1$, and counting up to $-1$ must give $0$ rather than wrapping around.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Treating a padding zero as a real digit | The count is wrong for any condition that looks at zeros or at the number of digits | Keep a started flag, or sum over lengths |
| Adding the digit to the sum unconditionally | The digit sum of `007` is $7$ instead of $7$ for the number $7$ | Use the contribution function |
| Comparing the whole number with the bound at the end | The program counts numbers above the bound | Enforce the bound digit by digit with the tight flag |
| Forgetting the tight flag on the last position | Numbers above the bound are counted | Update the flag on every position, including the last |
| Counting $[A, B]$ as `countUpTo(B) - countUpTo(A)` | The answer is off by one | Subtract `countUpTo(A - 1)` |
| Forgetting that `countUpTo(-1)` is zero | The answer is off by one when $A = 0$ | Guard the negative bound |
| Using the same accumulator value for two different conditions | The counts are silently wrong | Give every condition its own accumulator |
| Recursion on a bound given as a long string | A stack overflow in Python, Java, and JavaScript | Use the rolling-array form |
| Forgetting the modulo | The count overflows in languages with a 32-bit integer | Reduce after every addition |

### Why this fails: the padded zero

The plausible wrong approach is to drop the started flag entirely. Pad every number to the width of the bound with zeros, treat the padded string as the number's representation, and apply the condition to it. This is attractive because it removes a bit from the state, and it is correct for any condition that only looks at the digit sum.

The smallest counterexample is the count of integers in $[1, 100]$ that contain **exactly one** zero digit.

The correct answer is $9$: the numbers $10, 20, 30, 40, 50, 60, 70, 80, 90$ each contain exactly one zero, and $100$ contains two.

The padded program pads to three digits, so $10$ becomes `010`, which contains **two** zeros, and $100$ becomes `100`, which also contains two. No number in the range satisfies the padded condition, and the program reports $0$.

The mechanism is exact. Padding adds zeros to the front of the representation, and the padded string is not the number's decimal representation. A condition that counts zeros, or that counts the digits of the number, is sensitive to the difference. A condition on the digit sum is not, because adding zeros does not change the sum, and that is precisely the boundary of the technique.

The fix is the started flag, or the length formulation. With a started flag, the padding zeros contribute nothing to the count of zeros, so `010` contributes one zero, exactly as the number $10$ does.

A second and equally common variant of the same bug appears when the condition is "the number has exactly three digits". The correct count in $[1, 1000]$ is $900$, the numbers from $100$ to $999$. A padded program that counts the nonzero digits of the padded string counts $9^3 = 729$ instead, because it counts $111$ to $999$ with no zeros and misses every number with a zero in it.

The lesson generalizes: **a padding zero is not a digit of the number.** Any condition stated on the decimal representation of a number must be applied to the canonical representation, and the started flag is what enforces that.

## Variants and extensions

- **Counting in several bases.** The program is the same with $b = 2$, $b = 16$, or any other base. The only changes are the digit range and the contribution function.
- **Summing instead of counting.** The terminal state can add a value read from the digits rather than adding $1$, which counts the sum of the numbers that satisfy the condition.
- **The number of valid assignments of a pattern.** A digit DP over a pattern with wildcards, where the accumulator records how much of the pattern has been matched so far, is the standard way to count the ways to fill a template.
- **Digit sums modulo a number.** The accumulator can be a remainder rather than a sum, which counts the numbers whose digit sum is divisible by a given number.
- **Two bounds at once.** A variant of the state carries both bounds, with two tight flags, which counts the numbers in a range without the subtraction of two calls. It saves one factor of two and costs a bit of clarity.
- **The length formulation.** Summing over lengths removes the started flag, at the cost of one run per length.

## Contest strategy

1. Write the condition as an explicit accumulator update before writing any code. "The digit sum" means `acc += digit`. "Exactly one zero" means a two-part accumulator. If you cannot write the update, the program will not be correct.
2. Decide between the started flag and the length formulation before you start. The started flag generalizes; the length formulation is simpler when the condition is a sum.
3. Count $[A, B]$ as `countUpTo(B) - countUpTo(A - 1)`, and handle `countUpTo(-1) = 0`.
4. Test the boundaries explicitly: the bound itself, the lower bound of the range, zero, and a bound of a single digit.
5. Test the leading-zero behavior explicitly. A range such as $[1, 100]$ with a condition that mentions zero is the cheapest possible check.
6. If the answer is reported modulo a number, reduce after every addition. A count of $10^{18}$ overflows a 64-bit integer in a program that never reduces.
7. If the bound is a long string, write the rolling form from the start. Retrofitting it after a stack overflow costs more time than writing it once.

## Worked problems

### Problem 1: the digit sum

**Restatement.** Given $0 \le A \le B \le 10^{18}$, report how many integers in $[A, B]$ have a digit sum equal to $K$. Constraints: $0 \le K \le 162$.

**Naive baseline.** Enumerate the numbers and add their digit sums, which is $O((B - A) \cdot D)$.

**Insight.** The digit sum is additive over the digits, so it is a perfect accumulator, and the bound is enforced digit by digit.

**Derivation.** Run the program of the algorithm derivation with the accumulator set to the running digit sum, and with the contribution `digit` when the number has started and `0` otherwise. Answer with `countUpTo(B) - countUpTo(A - 1)`.

**Correctness.** The theorem above applies verbatim: the accumulator is sufficient for the digit sum, the tight flag enforces the bound, and the started flag keeps the padding zeros out of the sum.

**Complexity.** $O(D \cdot K \cdot 10)$ time and $O(D \cdot K)$ space with memoization, or $O(K)$ space with the rolling form. For $D = 19$ and $K = 162$ that is about $31\,000$ transitions.

**Common wrong approach.** Adding the digit unconditionally, which is wrong for the padding zeros, as the common mistakes section shows. The digit sum of the padded `007` is $7$, which happens to equal the digit sum of $7$, so the sum condition is not where the bug shows; the bug shows when the condition mentions zeros or the number of digits.

### Problem 2: the divisibility count

**Restatement.** Given $0 \le A \le B \le 10^{18}$ and a divisor $D$ with $1 \le D \le 10^6$, report how many integers in $[A, B]$ are divisible by $D$.

**Naive baseline.** Enumerate and test, which is $O(B - A)$.

**Insight.** The remainder of a number modulo $D$ is built from its digits: appending a digit $e$ to a prefix with remainder $r$ gives the remainder $(10r + e) \bmod D$. The remainder is therefore an accumulator, and it is a _sufficient_ one, because the divisibility condition depends on the number only through the remainder.

**Derivation.** Use the accumulator `rem`, with the update `rem = (10 * rem + digit) % D`. The terminal condition is `rem == 0`. The padding zeros do not change the remainder, so the contribution needs no started flag, and the program can use the length formulation or the started flag indifferently.

**Correctness.** The sufficiency lemma covers the remainder, because the divisibility condition is a predicate on the remainder alone. The leading-zero handling is irrelevant here, which is a good sanity check: the count of multiples of $D$ in $[0, 99]$ with $D = 7$ is $15$, namely $0, 7, 14, \ldots, 98$, and the program returns $15$ whether or not it pads.

**Complexity.** $O(D \cdot D \cdot 10)$ time and $O(D \cdot D)$ space, where the first $D$ is the number of digits of the bound and the second is the divisor. For a bound of $19$ digits and a divisor of $10^6$ the state count is $1.9 \times 10^7$, which is large but survivable; for a larger divisor, a different technique is needed.

**Common wrong approach.** Using the accumulator `rem` but updating it as `(rem + digit) % D` instead of `(10 * rem + digit) % D`. That computes the digit sum modulo $D$, not the number modulo $D$, and it gives the right answer only when $D$ divides $9$.

### Problem 3: the forbidden digit

**Restatement.** Given $0 \le A \le B \le 10^{18}$, report how many integers in $[A, B]$ contain no digit equal to $7$ in their decimal representation.

**Naive baseline.** Enumerate and test, which is $O((B - A) \cdot D)$.

**Insight.** The condition needs only a single bit: has a `7` appeared yet? The accumulator is that bit, and the transition is a two-case update.

**Derivation.** Use the accumulator `seen`, with the update `seen = seen or (digit == 7)`, and the terminal condition `not seen`. The started flag is unnecessary here, because a padding zero is not a `7` and cannot make the condition true; the flag matters only when the condition can be broken by a leading digit.

**Correctness.** The sufficiency lemma covers the flag, and the theorem applies. The numbers from $0$ to $99$ with no `7` are $100 - 19 = 81$, and the program returns $81$ with the bound `99`, because the padded `07` contains a `7` exactly when the number $7$ does.

**Complexity.** $O(D \cdot 2 \cdot 10)$ time and $O(D \cdot 2)$ space, which is $O(D)$ in practice. This is the cheapest digit program there is, and it is the one to reach for when the condition is a simple forbidden character.

**Common wrong approach.** Using the started flag to decide whether the digit may be `7`. That is, rejecting the digit `7` only when the number has started. The program then counts the number $7$ itself, because the padded `07` has a padding zero in front of it. The started flag exists to protect the _padding_ zeros, and it must not be used to hide real digits.

## Practice progression

1. **Recognition.** Given a statement, decide whether the condition is on the digits. Write the accumulator update in one line of pseudocode before writing any code.
2. **Direct application.** Implement `countUpTo` for the digit-sum condition, and check it against a brute-force enumeration on every range with a bound below $10^4$.
3. **Adaptation.** Change the accumulator to a remainder, to a forbidden-digit flag, and to a pattern flag, and check each against a brute force.
4. **Combination.** Combine the digit program with the started flag and the length formulation, and prove that the two agree on every bound below $10^5$. Then use the started flag to answer a condition that counts zeros.
5. **Challenge.** Write the version with two bounds and two tight flags, and count the numbers in a range without the subtraction, then compare the running times.
6. **Transfer.** Recognize a digit program in a different shape: counting the ways to fill a numeric template with wildcards, or counting the numbers whose digits satisfy a constraint given by a small automaton.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What are the four parts of the state, and what does each one decide? (Formal model)
2. Why is the started flag needed at all, given that the bound is padded to a fixed width? (Common mistakes)
3. What is the smallest counterexample that breaks the padded approach, and what does the buggy program report? (Common mistakes)
4. State the recurrence for $F$ in terms of the tight flag and the limit $L(i, t)$. (Algorithm derivation)
5. Why does the contribution function use the old started flag rather than the new one? (Implementation walkthrough)
6. How is the range $[A, B]$ converted into two calls, and what happens when $A = 0$? (Implementation walkthrough)
7. Why does the proof of sufficiency of the accumulator hold for a remainder but not for the number's value? (Formal model)
8. How does the size of the accumulator $S$ depend on the condition, and what is $S$ for a digit sum? (Complexity analysis)
9. When is the recursive form safe, and when must the rolling form be used? (Recursion decision)
10. Why is the tight flag still needed on the last position of the number? (Algorithm derivation)

## Further reading

- The subject index lists this technique, [digit dynamic programming](/algorithms/dynamic-programming/digit-dp), beside the other dynamic programs in the encyclopedia.
- The dynamic program that replaces a backtracking search when the constraints involve a global property is in [0/1 knapsack](/algorithms/dynamic-programming/0-1-knapsack).
- The ordering of a directed acyclic graph, which is the same idea applied to a graph rather than to a number, is in [topological sort](/algorithms/graphs/topological-sort).
- The arithmetic that keeps a large count inside a machine word is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The memoized search that the digit program replaces, and the reason memoization is the cure for it, is in [backtracking](/algorithms/enumeration/backtracking).
- The bit representation of an integer, which is the same technique with a base of $2$, is in [binary representation](/algorithms/foundations/binary-representation).
- The discrete mathematics behind the divisibility rules that a remainder accumulator uses is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
