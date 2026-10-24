---
id: number-theory.discrete-logarithm
title: The discrete logarithm
summary: Find the smallest exponent x with a to the x congruent to b modulo m by meeting in the middle, with a table of baby steps against giant steps of the square root of m.
division: [gold, platinum]
subjects: [number-theory]
level: advanced
importance: advanced-technique
keywords:
    [
        discrete logarithm,
        baby-step giant-step,
        BSGS,
        meet in the middle,
        multiplicative order,
        primitive root,
        modular inverse,
        Pohlig-Hellman,
    ]
prerequisites:
    required: [number-theory.modular-arithmetic]
    recommended: [number-theory.extended-euclidean, foundations.binary-representation]
complexity:
    time: "O(sqrt m) modular multiplications per query"
    space: "O(sqrt m)"
assumptions:
    - The base a and the modulus m are coprime, so every power of a is invertible modulo m.
    - The modulus is at most 2^31 - 1, so the product of two residues fits in a signed 64-bit integer.
    - The exponent is the smallest non-negative solution, and a^0 = 1.
implementations: number-theory.discrete-logarithm
reviewed: false
---

## At a glance

The discrete logarithm is the inverse of modular exponentiation. Given $a$, $b$ and $m$, it asks for an exponent $x$ with

$$
a^x \equiv b \pmod m.
$$

Exponentiation is cheap: binary exponentiation computes $a^x \bmod m$ in $O(\log x)$ multiplications. Inverting it is believed to be hard in general, and that asymmetry is the basis of Diffie-Hellman key exchange, ElGamal encryption and the discrete logarithm problem over elliptic curves. Contest problems use moduli small enough for a square-root algorithm, and the algorithm is the baby-step giant-step method of Daniel Shanks.

Four facts carry the technique.

1. **The unknown exponent splits into two halves.** With $n = \lceil \sqrt{m} \rceil$, every exponent $x$ with $1 \le x < n^2$ can be written as $x = pn - q$ with $1 \le p \le n$ and $0 \le q < n$.
2. **The split turns the power into a match.** Since $a$ is invertible modulo $m$, the congruence $a^{pn-q} \equiv b$ is equivalent to $a^{pn} \equiv b a^q \pmod m$.
3. **Both sides cost a square root.** There are $n$ baby steps $b a^q$ and $n$ giant steps $(a^n)^p$, so a hash table joins them in $O(\sqrt{m})$ time and space.
4. **Smaller is decided by the table policy.** Storing the largest $q$ for each key and scanning $p$ upward makes the first match the smallest positive exponent.

The reference program reads $q$ triples $(a, b, m)$, assumes $\gcd(a, m) = 1$, and prints the smallest non-negative $x$ with $a^x \equiv b \pmod m$, or $-1$ when no such $x$ exists. The modulus is at most $2^{31} - 1$, so the table has at most $46\,341$ entries per query.

## Problem motivation

A program must solve $3^x \equiv 2 \pmod{10^9 + 7}$. The answer is $x = 316\,884\,446$, which is smaller than the modulus but far too large for a loop. A brute force multiplies by $3$ once per candidate exponent, so it needs about $3 \times 10^8$ multiplications before it reaches the answer, and the worst case is the full modulus, $10^9$ multiplications. At a hundred million multiplications per second that is ten seconds for one query, and a hundred queries would cost a thousand seconds.

The baby-step giant-step algorithm solves the same query in about $2 \sqrt{10^9 + 7} \approx 63\,246$ multiplications, with a table of $31\,623$ entries. The improvement is not a constant factor; it is the difference between $m$ and $\sqrt{m}$, and it comes from splitting the unknown exponent in half instead of visiting every candidate.

The problem appears in several disguises. A primitive root problem asks for the exponent of every residue. A key-exchange exercise asks for a shared secret from two public powers. A recurrence whose terms are multiplied asks for the exponent of a single term, which is the shape of the hardest worked problem below. In each case the forward operation is a modular power and the inverse is a discrete logarithm.

## Recognition patterns

The discrete logarithm is the right tool when the statement contains some of these phrases.

- "$a^x \equiv b \pmod m$", "find the exponent", "the discrete logarithm of $b$ to the base $a$".
- "The smallest non-negative $x$", "find any $x$", "print $-1$ if no such $x$ exists".
- "Primitive root", "the order of $a$ modulo $m$", "the powers of $a$ cycle".
- "The modulus is prime", followed by a request for an exponent rather than a value.
- "A recurrence of products", where taking an exponent turns the products into sums.
- A key-exchange or cryptographic story, with a public base and a public power.

The constraint values that decide the technique:

| Constraint | What it rules |
| --- | --- |
| $m \le 10^6$ | A linear scan is acceptable, and the table is unnecessary |
| $m \le 10^9$, a few queries | Baby-step giant-step with at most $31\,623$ entries |
| $m \le 10^{12}$, one query | A table of a million entries, which is the practical limit |
| $m \le 10^{18}$ | A table of a billion entries is too large; index calculus or a different structure is needed |
| $a$ and $m$ are coprime | The plain algorithm applies directly |
| $a$ and $m$ share a factor | The common factor must be peeled first, or the table can report a false solution |
| $b = 1$ | The answer is $0$, and the giant-step loop would miss it |
| $b = 0$ and $m > 1$ | No power of a unit is zero, so the answer is $-1$ |
| The modulus is prime and $a$ is a primitive root | Every $b \ne 0$ has a logarithm, and the exponent is unique modulo $m - 1$ |
| The modulus is composite | Logarithms exist only inside the subgroup generated by $a$ |

The sixth row is the one that costs submissions. The derivation of the algorithm multiplies by $a^q$, which is only reversible when $a$ is invertible. When $\gcd(a, m) > 1$, the match can be a false positive: the program finds $p$ and $q$ with $a^{pn} \equiv b a^q$, concludes $a^{pn-q} \equiv b$, and the cancellation is invalid. The worked problems show the repair.

## Naive approach

The baseline multiplies by $a$ until the target appears.

```python
def discrete_log_naive(a, b, m):
    cur = 1 % m
    for x in range(m):
        if cur == b % m:
            return x
        cur = cur * a % m
    return -1
```

The loop is correct because the powers repeat with period at most $m$: there are only $m$ residues, so either the target appears within the first $m$ powers or it never appears. The cost is $O(m)$ multiplications and $O(1)$ space.

For $m = 10^9 + 7$ the loop runs a billion times in the worst case. For $m = 10^{12}$ it is unusable. The reduction modulo $m$ is not the problem; the number of distinct exponents is.

A second baseline stores every power in a hash table and then scans the targets, which is still $O(m)$ time and now $O(m)$ space. It is worse than the first baseline in every respect, and it is worth naming only because the correct algorithm is a refinement of it: baby-step giant-step stores $\sqrt{m}$ powers instead of $m$ and searches the other $\sqrt{m}$ powers against them.

There is no closed-form shortcut in general. When $m$ is prime and $a$ is a primitive root, the logarithm is a well-defined function on the nonzero residues, but evaluating it is exactly the hard problem. Fermat's little theorem bounds the exponent by $m - 1$; it does not compute it.

## Key insight

The insight is that the exponent can be split into a quotient and a remainder of a square root, and the two halves can be computed separately.

Let

$$
n = \lceil \sqrt{m} \rceil.
$$

For every exponent $x$ with $1 \le x < n^2$, write

$$
p = \left\lceil \frac{x}{n} \right\rceil, \qquad q = pn - x.
$$

Then $1 \le p \le n$ and $0 \le q < n$. The congruence becomes

$$
a^{pn - q} \equiv b \pmod m.
$$

Because $\gcd(a, m) = 1$, the power $a^q$ has an inverse modulo $m$, so multiplying both sides by $a^q$ gives the equivalent equation

$$
a^{pn} \equiv b a^q \pmod m.
$$

The left side depends only on $p$, and the right side depends only on $q$. That is the meet in the middle: build a table of the $n$ right-hand values, then compute the $n$ left-hand values and look each one up.

The table stores the largest $q$ that produces each key. That choice is not arbitrary. Suppose a key $b a^q$ appears for two baby steps $q_1 < q_2$. Both give a solution, but the one with $q_2$ is smaller, because $pn - q_2 < pn - q_1$. Storing the largest $q$ therefore returns the smallest exponent inside the block of $p$. Scanning $p$ from $1$ upward then makes the first match the smallest exponent overall.

The classic formulation stores $a^q$ instead of $b a^q$ and multiplies $b$ by $(a^{-n})^p$ at each giant step. It needs one modular inverse, but it has an advantage: for a fixed base and modulus, the baby-step table can be reused for every target. The reference programs use the inverse-free formulation because it has fewer moving parts and every query has its own target anyway.

## Visual intuition

Draw two ladders that meet on the same value.

```text
baby steps   (right side)     b,  ba,  ba^2,  ...,  ba^(n-1)
                                    \    \     \          \
                                     \    \     \          \
giant steps  (left side)      a^n, a^2n, a^3n, ..., a^(n*n)
```

A rung of the first ladder and a rung of the second ladder that carry the same residue form a solution: if $b a^q = a^{pn}$, then $a^{pn-q} = b$.

For $a = 3$, $b = 5$ and $m = 7$, the square root is $n = 3$. The baby steps are

| $q$ | $b a^q \bmod 7$ |
| --- | --------------- |
| 0   | 5               |
| 1   | 1               |
| 2   | 3               |

and the giant steps are

| $p$ | $a^{pn} \bmod 7$    | Match   |
| --- | ------------------- | ------- |
| 1   | $3^3 = 27 \equiv 6$ | none    |
| 2   | $6^2 = 36 \equiv 1$ | $q = 1$ |

The match at $p = 2$ and $q = 1$ gives $x = 2 \ast 3 - 1 = 5$, and indeed $3^5 = 243 \equiv 5 \pmod 7$.

The picture also shows why the table is the expensive part. The two ladders each have about $\sqrt{m}$ rungs, so the table is a square-root object. Doubling the modulus multiplies the work by about $1.41$, not by $2$.

## Formal model

::: math definition Definition
For integers $a$, $b$ and a positive modulus $m$, write $a \equiv b \pmod m$ when $m$ divides $a - b$. The residue of $a$ is the unique integer in $[0, m)$ congruent to $a$.
:::

::: math definition Definition
Let $m > 1$ and let $a$ be coprime to $m$. The **order** of $a$ modulo $m$, written $\operatorname{ord}_m(a)$, is the smallest positive integer $k$ with $a^k \equiv 1 \pmod m$.
:::

::: math definition Definition
Let $a$ be coprime to $m$ and let $b$ be a residue. The **discrete logarithm** of $b$ to the base $a$ modulo $m$ is the smallest non-negative integer $x$ with $a^x \equiv b \pmod m$. It is written $\log_a b$ when the modulus is understood, and it does not exist when no such $x$ exists.
:::

::: math lemma Lemma
For $m > 1$ and $\gcd(a, m) = 1$, the order of $a$ exists, is at most $\varphi(m)$, and the powers $a^0, a^1, \ldots, a^{\operatorname{ord}_m(a)-1}$ are pairwise distinct.
:::

::: math proof Proof
Euler's theorem gives $a^{\varphi(m)} \equiv 1 \pmod m$, so the set of positive exponents with $a^k \equiv 1$ is nonempty and has a least element. Its least element is at most $\varphi(m)$.

Suppose $a^i \equiv a^j$ with $0 \le i < j < \operatorname{ord}_m(a)$. Multiplying by the inverse of $a^i$ gives $a^{j-i} \equiv 1$, and $0 < j - i < \operatorname{ord}_m(a)$, which contradicts the definition of the order. So the powers in that range are distinct. $\square$
:::

::: math lemma Lemma
For $m > 1$, $\gcd(a, m) = 1$ and any residue $b$, if a solution of $a^x \equiv b \pmod m$ exists, then some solution $r$ satisfies $0 \le r < \operatorname{ord}_m(a)$. In particular, the smallest solution, when it exists, is smaller than $m$.
:::

::: math proof Proof
Take any solution $x$. If $x \ge \operatorname{ord}_m(a)$, write $x = k \cdot \operatorname{ord}_m(a) + r$ with $0 \le r < \operatorname{ord}_m(a)$. Then $a^x = (a^{\operatorname{ord}_m(a)})^k a^r \equiv a^r$, so $r$ is a smaller non-negative solution. Repeating the reduction gives a solution below the order.

The order is at most $\varphi(m)$, and $\varphi(m) < m$ for every $m > 1$, so the smallest solution is below $m$. $\square$
:::

::: math definition Definition
Let $n = \lceil \sqrt{m} \rceil$. The **baby-step table** for the triple $(a, b, m)$ maps a residue $k$ to the largest $q \in [0, n)$ with $b a^q \equiv k \pmod m$. The **giant steps** are the residues $a^{pn} \bmod m$ for $p = 1, 2, \ldots, n$.
:::

::: math theorem Theorem
If $\gcd(a, m) = 1$ and $m > 1$, the baby-step giant-step procedure returns the smallest non-negative solution of $a^x \equiv b \pmod m$, and returns $-1$ when no solution exists.
:::

The proof is in the correctness section, after the procedure has been written down.

## Algorithm derivation

The derivation has six steps.

**Step 1: handle the exponent zero.** Every positive power of a unit is a unit, but $a^0 = 1$. If $b \equiv 1 \pmod m$, the smallest solution is $0$. The giant-step loop starts at $p = 1$ and therefore cannot see $x = 0$, so this case must be decided first.

**Step 2: choose the block size.** The block size is $n = \lceil \sqrt{m} \rceil$. An integer square root avoids the rounding of a floating-point square root.

```cpp
long long n = 1;
while (n * n < m) {
    ++n;
}
```

The loop runs at most $\sqrt{m}$ times, which is negligible next to the two square-root passes that follow. In Python the standard library supplies `math.isqrt`.

**Step 3: build the baby-step table.** Start at $b$ and multiply by $a$ once per step. The key is the current residue, and the value is the step index. Inserting in increasing order and overwriting on a duplicate leaves the largest $q$.

```cpp
std::uint64_t cur = b;
for (std::uint64_t q = 0; q < n; ++q) {
    std::uint32_t key = static_cast<std::uint32_t>(cur);
    std::uint32_t h = static_cast<std::uint32_t>((static_cast<std::uint64_t>(key) * 40503u) & mask);
    while (keys[h] != EMPTY && keys[h] != key) {
        h = (h + 1) & mask;
    }
    keys[h] = key;
    values[h] = static_cast<std::uint32_t>(q);
    cur = cur * a % m;
}
```

The hash table is open addressing with linear probing. The sentinel `EMPTY` is `0xFFFFFFFF`, which is safe because every residue is below $2^{31}$.

**Step 4: compute one giant stride.** The stride is $a^n \bmod m$, computed by binary exponentiation.

```cpp
std::uint64_t pow_mod(std::uint64_t a, std::uint64_t e, std::uint64_t m) {
    std::uint64_t result = 1 % m;
    a %= m;
    while (e > 0) {
        if (e & 1) {
            result = result * a % m;
        }
        a = a * a % m;
        e >>= 1;
    }
    return result;
}

std::uint64_t stride = pow_mod(a, n, m);
```

**Step 5: walk the giant steps.** Start at $1$ and multiply by the stride before each lookup, so the value at iteration $p$ is $a^{pn}$.

```cpp
std::uint64_t cur = 1;
for (std::uint64_t p = 1; p <= n; ++p) {
    cur = cur * stride % m;
    std::uint32_t key = static_cast<std::uint32_t>(cur);
    // probe the table for key
    // on a hit with baby step q: return p * n - q
}
```

The loop runs to $p = n$ inclusive. With $x < m \le n^2$, the quotient $p = \lceil x/n \rceil$ never exceeds $n$.

**Step 6: report failure.** If no giant step matches a baby step, no exponent in $[1, n^2)$ works. Every solution is below $m \le n^2$, so the answer is $-1$.

The procedure never divides modulo $m$, never computes a modular inverse, and never relies on the modulus being prime. It relies only on $a$ being invertible, which is the coprimality assumption.

## Step-by-step execution

**The small trace: $a = 3$, $b = 5$, $m = 7$.** Here $n = 3$.

| Baby step $q$ | $b a^q \bmod 7$          | Stored value |
| ------------- | ------------------------ | ------------ |
| 0             | 5                        | 0            |
| 1             | $5 \ast 3 = 15 \equiv 1$ | 1            |
| 2             | $1 \ast 3 = 3$           | 2            |

The stride is $3^3 = 27 \equiv 6 \pmod 7$. The giant steps are $6$ for $p = 1$ and $6^2 = 36 \equiv 1$ for $p = 2$. The second one matches the key $1$, whose stored baby step is $q = 1$, so the answer is $2 \ast 3 - 1 = 5$. The check is $3^5 = 243 = 34 \ast 7 + 5$.

**A composite modulus with no solution: $a = 2$, $b = 3$, $m = 9$.** Here $n = 3$, and $\gcd(2, 9) = 1$.

| Baby step $q$ | $b a^q \bmod 9$          | Stored value |
| ------------- | ------------------------ | ------------ |
| 0             | 3                        | 0            |
| 1             | 6                        | 1            |
| 2             | $6 \ast 2 = 12 \equiv 3$ | 2            |

The key $3$ appears twice, and the second insertion overwrites the first with $q = 2$. The stride is $2^3 = 8$. The giant steps are $8$, $8^2 = 64 \equiv 1$, and $8^3 \equiv 8$, none of which is a key. The procedure returns $-1$. A direct scan confirms it: the powers of $2$ modulo $9$ are $1, 2, 4, 8, 7, 5, 1$, and $3$ never appears.

**A large prime: $a = 3$, $b = 2$, $m = 10^9 + 7$.** Here $n = 31\,623$, and the table has $31\,623$ entries. The stride is $3^{31\,623} \bmod m$. The first match occurs at $p = 10\,021$, where the giant step equals $b a^q$ for $q = 9\,637$, so the answer is

$$
10\,021 \ast 31\,623 - 9\,637 = 316\,884\,446.
$$

The check is $3^{316\,884\,446} \equiv 2 \pmod{10^9 + 7}$. The same computation by linear scan would need more than three hundred million multiplications; the table needs about sixty-three thousand.

**The boundary: $a = 1$, $b = 1$, $m = 2$.** The early test returns $0$, because $1^0 = 1$. The same test on $a = 1$, $b = 0$, $m = 2$ does not fire; the table contains the key $0$ with $q = 0$, the stride is $1$, and every giant step is $1$, so the procedure returns $-1$. That is correct because $1^x$ is never $0$ modulo $2$.

## Correctness proof

::: math theorem Theorem
Assume $m > 1$ and $\gcd(a, m) = 1$. The procedure returns the smallest non-negative $x$ with $a^x \equiv b \pmod m$ when such an $x$ exists, and returns $-1$ otherwise.
:::

::: math proof Proof
**The table is faithful.** After the baby-step loop, for every key $k$ that occurs, the stored value is the largest $q \in [0, n)$ with $b a^q \equiv k \pmod m$. The loop inserts $q$ in increasing order, and an insertion with an equal key overwrites the previous value, so the final value is the largest one.

**A returned value is a solution.** Suppose the procedure returns $x = pn - q$ at giant step $p$ with baby step $q$. The match means $a^{pn} \equiv b a^q \pmod m$. Multiplying by the inverse of $a^q$, which exists because $\gcd(a, m) = 1$, gives $a^{pn-q} \equiv b \pmod m$. Also $1 \le p \le n$ and $0 \le q < n$, so $x \ge pn - (n - 1) \ge 1$ and the returned value is a non-negative solution.

**The smallest solution is found.** Suppose a solution exists, and let $x^\ast$ be the smallest positive one. (The case $b = 1$ is answered by $0$ before the loops, so assume $b \not\equiv 1$ and $x^\ast \ge 1$.) By the range lemma, $x^\ast < m \le n^2$. Set

$$
p^\ast = \left\lceil \frac{x^\ast}{n} \right\rceil, \qquad q^\ast = p^\ast n - x^\ast.
$$

Then $1 \le p^\ast \le n$ and $0 \le q^\ast < n$, and

$$
a^{p^\ast n} = a^{x^\ast + q^\ast} \equiv b a^{q^\ast} \pmod m.
$$

So the key $b a^{q^\ast}$ is in the table with some stored value $q' \ge q^\ast$. At giant step $p^\ast$ the procedure sees that key and returns $p^\ast n - q' \le p^\ast n - q^\ast = x^\ast$. The returned value is a solution by the previous paragraph, and no solution is smaller than $x^\ast$, so the returned value equals $x^\ast$.

It remains to see that no earlier giant step returns a value. If the loop returned at some $p < p^\ast$, the returned value would satisfy $x \le pn \le p^\ast n - n < x^\ast$, where the last inequality uses $p^\ast = \lceil x^\ast/n \rceil$, which gives $(p^\ast - 1)n < x^\ast$. That would be a positive solution smaller than $x^\ast$, a contradiction. Hence the first match is at $p^\ast$ and returns exactly $x^\ast$.

**The failure is correct.** If the procedure returns $-1$, no giant step matched a table key. Suppose a solution $x \ge 1$ exists. By the range lemma it reduces to a solution $r$ with $1 \le r < m \le n^2$, and the argument above produces a match at $p = \lceil r/n \rceil$, a contradiction. The case $x = 0$ was decided by the early test. $\square$
:::

::: math invariant Invariant
After $q$ baby steps, the table contains the pairs $(b a^j \bmod m, j)$ for $0 \le j \le q$, with the largest $j$ retained for each residue. After $p$ giant steps, the running value is $a^{pn} \bmod m$.
:::

The invariant is what makes the failure answer trustworthy: the table has examined every baby step in the block, and the giant loop has examined every block up to $n$, so a missing match means every exponent below $n^2$ has been ruled out.

## Complexity analysis

| Phase               | Time                                    | Space         |
| ------------------- | --------------------------------------- | ------------- |
| Integer square root | $O(\sqrt{m})$ additions and comparisons | $O(1)$        |
| Baby-step table     | $O(\sqrt{m})$ expected hash operations  | $O(\sqrt{m})$ |
| Stride $a^n$        | $O(\log n)$ modular multiplications     | $O(1)$        |
| Giant steps         | $O(\sqrt{m})$ expected hash lookups     | $O(1)$        |
| Total               | $O(\sqrt{m})$ expected                  | $O(\sqrt{m})$ |

Each table insert and each lookup is expected $O(1)$ with a load factor at most one half. The C, C++ and Java programs size the table at the smallest power of two that is at least $2n$, so the load factor is at most one half, and the Pascal program uses a fixed table of $131\,072$ slots, which is enough for every $n$ in range. The mixing step spreads the low bits of the key, and linear probing keeps the entries in one cache line in the common case.

The worst case of open addressing is $O(n^2)$ when every key collides, but that requires an adversarial residue sequence. For a judged solution, the mixing constant and the power-of-two table make the expected bound the relevant one. A balanced tree would give a guaranteed $O(\sqrt{m} \log m)$ and is the safer choice when the keys are known to be adversarial.

The numbers are worth memorizing:

| Modulus      | Block size    | Table entries |
| ------------ | ------------- | ------------- |
| $10^6$       | $1\,000$      | $1\,000$      |
| $10^9$       | $31\,623$     | $31\,623$     |
| $2^{31} - 1$ | $46\,341$     | $46\,341$     |
| $10^{12}$    | $1\,000\,000$ | $1\,000\,000$ |

In bit complexity, one modular multiplication of two $\log m$-bit numbers costs $O(\log^2 m)$ schoolbook operations, and the procedure performs $O(\sqrt{m})$ of them, so the bit complexity is $O(\sqrt{m} \log^2 m)$.

The Pascal variant multiplies by repeated doubling because the browser compiler has no 128-bit integer. One multiplication becomes $O(\log m)$ additions, so its total is $O(\sqrt{m} \log m)$ word operations. It is still exact and still small for the stated modulus.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| $m \le 10^6$ and one query | A linear scan is simpler and fast enough |
| $m \le 10^9$ and a few queries | Baby-step giant-step |
| $m \le 10^{12}$ and one query | Baby-step giant-step with a million-entry table |
| $m$ beyond $10^{12}$ | Index calculus for prime fields, or a different group |
| $\gcd(a, m) > 1$ | Peel the common factor first, then run baby-step giant-step |
| $b = 1$ | Return $0$ immediately |
| $b = 0$ and $m > 1$ | Return $-1$ because a unit has no zero power |
| The problem asks for the order of $a$ | Factor $\varphi(m)$ and test divisors, not a discrete log |
| Many targets with the same base and modulus | Store $a^q$ once and reuse the table with the inverse stride |
| The modulus is a product of known primes | Solve modulo each prime power and combine with the Chinese remainder theorem |
| The group is an elliptic curve | The same meet-in-the-middle idea, with point addition in place of multiplication |
| $m$ is prime and $m - 1$ is smooth | Pohlig-Hellman, which is faster than baby-step giant-step |

The order computation deserves a note. The multiplicative order of $a$ is the smallest positive $k$ with $a^k \equiv 1$, which is a discrete logarithm with target $1$ but with the exponent $0$ excluded. Factoring $\varphi(m)$ and removing a prime factor from the exponent whenever the power stays $1$ finds the order without a square-root table, and baby-step giant-step is the wrong tool for it.

## Reference implementations

All six programs share one contract.

- **Input:** $q$ on the first line, then $q$ lines, each holding $a$, $b$ and $m$ with $1 \le a < m \le 2^{31} - 1$ and $\gcd(a, m) = 1$, and $0 \le b < m$.
- **Output:** one line per query, holding the smallest non-negative $x$ with $a^x \equiv b \pmod m$, or $-1$ when no such $x$ exists.

The separation into queries keeps the table per triple. A table keyed by $b a^q$ depends on $b$, so it cannot be reused across different targets; the classic inverse formulation can, and the variants section explains when that matters.

| Language | File | Baby-step table | Product |
| --- | --- | --- | --- |
| C | `c/program.c` | Open addressing with `uint32_t` | `uint64_t`, exact below $2^{62}$ |
| C++17 | `cpp17/program.cpp` | Open addressing with `std::uint32_t` | `std::uint64_t`, exact below $2^{62}$ |
| Java | `java/Main.java` | Open addressing with `int` arrays | `long`, exact below $2^{62}$ |
| Python | `python/program.py` | Dictionary | Arbitrary-precision integers |
| Pascal | `pascal/program.pas` | Static open addressing with `LongWord` | Repeated doubling, exact under the browser compiler |
| JavaScript | `javascript/program.js` | `Map` with `BigInt` keys | `BigInt` |

The C and C++ variants set the standard output to binary mode so their line feeds match the other four byte for byte. The JavaScript and Pascal variants are educational references, not USACO submission languages. The Pascal variant avoids 128-bit integers, reads one argument per `Read` call, and declares `SysUtils`.

## Recursion decision

Binary exponentiation has a natural recursive form:

```cpp
std::uint64_t pow_mod(std::uint64_t a, std::uint64_t e, std::uint64_t m) {
    if (e == 0) return 1 % m;
    std::uint64_t half = pow_mod(a, e / 2, m);
    std::uint64_t square = half * half % m;
    return (e & 1) ? square * a % m : square;
}
```

The recursion halves the exponent at each level, so the depth is $O(\log e)$, at most 16 for the block size here. The baby-step and giant-step loops are naturally iterative, and the hash probing is a small inner loop.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames | Iterative, for speed and for one fewer thing to explain |
| Java | About $10^4$ frames | Iterative |
| Python | Interpreter limit of 1000 | Iterative |
| Pascal | The browser compiler stack | Iterative |
| JavaScript | About $10^4$ frames | Iterative |

The depth is never the obstacle: 16 frames are harmless in every language. The iterative power is still the better choice because it keeps the accumulator and the running square in local variables, and because the giant-step loop calls it once per query rather than once per exponentiation. None of the six reference programs uses recursion.

## Implementation walkthrough

The first detail is the integer square root. A floating-point `sqrt` can land one below the true root for a perfect square near the top of the range, which makes the block size too small and the table incomplete. The reference programs compute the root with a loop or with `math.isqrt`, and the loop's $46\,341$ iterations cost about one extra table pass.

```cpp
long long n = 1;
while (n * n < m) {
    ++n;
}
```

The second detail is the key of the table. The reference programs store $b a^q$, not $a^q$. That choice is what removes the modular inverse: the giant step is $a^{pn}$ directly, and no extended Euclidean algorithm is needed. The classic formulation stores $a^q$ and multiplies the target by $(a^{-n})^p$ at every giant step; both are correct, but the reference has fewer pieces.

The third detail is the overwrite policy. In the subtractive decomposition $x = pn - q$, a larger $q$ means a smaller $x$, so the table must keep the largest $q$. The additive decomposition $x = pn + q$ keeps the smallest $q$ instead. Mixing the two produces a correct-looking answer that is too large, which is the failure analyzed below.

The fourth detail is the sentinel. Every residue is below $m \le 2^{31} - 1$, so `0xFFFFFFFF` is not a possible key and can mark an empty slot. Storing keys in 32-bit integers halves the table memory and keeps the probe sequence in cache. A key of zero is a real key when $b = 0$, and the sentinel choice leaves it usable.

The fifth detail is the width of the product. Two residues below $2^{31}$ have a product below $2^{62}$, which fits in an unsigned 64-bit integer and in a signed 64-bit integer. A modulus near $10^{18}$ would need a 128-bit intermediate, and JavaScript needs `BigInt` even for small moduli because its `Number` loses exactness above $2^{53}$.

```cpp
std::uint64_t mul_mod(std::uint64_t a, std::uint64_t b, std::uint64_t m) {
    return a * b % m;   // safe because m < 2^31
}
```

The sixth detail is the range of the giant loop. It runs from $p = 1$ to $p = n$ inclusive. The case $x = 0$ is handled before the loop, and for $x \ge 1$ the quotient $\lceil x/n \rceil$ is at least $1$ and at most $n$. Stopping at $n - 1$ would miss the solutions whose quotient is exactly $n$.

The seventh detail is the early return for $b = 1$. Without it, the algorithm cannot return $0$ at all: the giant loop starts at $p = 1$, so every returned value is positive, and the result is the smallest positive exponent, a multiple of the order, instead of $0$. The early test is one comparison and removes the ambiguity.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Forgetting the case $b = 1$ | The answer is a multiple of the order instead of $0$ | Return $0$ before the loops |
| Using $\lfloor \sqrt{m} \rfloor$ without rounding up | The table misses the top block of exponents | Use $\lceil \sqrt{m} \rceil$ |
| Keeping the smallest $q$ in the subtractive form | The returned exponent is too large | Overwrite with the largest $q$ |
| Keeping the largest $q$ in the additive form | The returned exponent is too large | Match the policy to the decomposition |
| Building a table of $a^q$ and then matching $b a^{pn}$ | The sign of the answer is reversed | Match $a^{pn}$ against $b a^q$ |
| Canceling $a^q$ when $\gcd(a, m) > 1$ | A false match is reported as a solution | Peel the common factor first |
| Multiplying residues in 32 bits | The product wraps and the key is wrong | Use a 64-bit product |
| Storing $b a^q$ in a table shared across targets | The keys belong to the old target | Rebuild the table per target, or use $a^q$ and an inverse |
| Running the giant loop to $n - 1$ | The top block of exponents is missed | Run to $n$ inclusive |
| Treating $-1$ as a valid residue | The table key and the sentinel collide | Normalize every residue into $[0, m)$ |

### Why this fails: keeping the first baby step

The plausible wrong solution stores the first occurrence of each key instead of the last. In the additive decomposition that is the correct policy, and it is easy to carry over by mistake.

Take $a = 3$, $b = 3$ and $m = 8$. The modulus is composite, but $\gcd(3, 8) = 1$, so the plain algorithm applies. The block size is $n = 3$. The baby steps are

| $q$ | $b a^q \bmod 8$         | First occurrence | Last occurrence |
| --- | ----------------------- | ---------------- | --------------- |
| 0   | 3                       | 0                | 0               |
| 1   | $3 \ast 3 = 9 \equiv 1$ | 1                | 1               |
| 2   | $1 \ast 3 = 3$          | 0                | 2               |

The key $3$ occurs at $q = 0$ and again at $q = 2$. The stride is $3^3 = 27 \equiv 3 \pmod 8$. At $p = 1$ the giant step is $3$, which matches.

- With the first occurrence $q = 0$, the program returns $1 \ast 3 - 0 = 3$. The check passes, because $3^3 = 27 \equiv 3 \pmod 8$.
- With the last occurrence $q = 2$, the program returns $1 \ast 3 - 2 = 1$. The check also passes, because $3^1 = 3$.

Both are solutions, but only $1$ is the smallest. The first-occurrence policy returns a correct exponent and the wrong answer, which is the worst kind of bug: every sample that has a unique logarithm passes, and only the smallest-exponent tests fail.

The lesson generalizes. **The table policy is part of the decomposition, not an implementation detail.** Writing $x = pn + q$ makes $q$ the remainder and rewards the smallest $q$; writing $x = pn - q$ makes $q$ the distance back from the block boundary and rewards the largest $q$. Pick one decomposition and keep its policy.

### Why this fails: plain baby-step giant-step on a non-coprime triple

The second mistake is skipping the coprimality check. Take $a = 2$, $b = 0$ and $m = 4$. The block size is $n = 2$.

The baby steps are $b a^0 = 0$ and $b a^1 = 0$, so the table has the key $0$ with $q = 1$ after the overwrite. The stride is $2^2 = 4 \equiv 0$. At $p = 1$ the giant step is $0$, which matches, and the program returns $1 \ast 2 - 1 = 1$. But $2^1 = 2 \not\equiv 0 \pmod 4$.

The cancellation in the proof is invalid: $a^q = 2$ has no inverse modulo $4$. The true smallest solution is $2$, because $2^2 = 4 \equiv 0$. The repair is to divide the congruence by the common factor before building the table, which is the extended variant described next.

## Variants and extensions

- **Extended baby-step giant-step.** When $g = \gcd(a, m) > 1$, every solution with $x \ge 1$ has $g \mid b$. Write $a = g a'$, $m = g m'$ and $b = g b'$. Dividing the congruence by $g$ gives $a' a^{x-1} \equiv b' \pmod{m'}$, and multiplying by the inverse of $a'$ modulo $m'$ gives a smaller instance $a^{x-1} \equiv b' (a')^{-1} \pmod{m'}$. Repeat until the base and the modulus are coprime, count the number of peels, run the plain algorithm, and add the count. Each peel costs $O(\log m)$ for the inverse, and there are $O(\log m)$ peels.
- **The inverse formulation.** Store $a^q$ in the table and compute $b (a^{-n})^p$ at each giant step. The first match gives $x = pn + q$. The advantage is that the table depends only on $a$ and $m$, so it can be built once and reused for many targets.
- **Pohlig-Hellman.** Factor the order of $a$ into prime powers. Solve the discrete logarithm modulo each prime power by reducing to a subgroup of prime order, then combine the residues with the Chinese remainder theorem. The cost is the sum of the square roots of the prime factors, which is much smaller than $\sqrt{m}$ when the order is smooth.
- **Pollard's rho for discrete logarithms.** A random walk on the powers of $a$ finds a collision in $O(\sqrt{m})$ time with $O(1)$ space. It trades the table for a heuristic and is the standard choice when memory is tight.
- **Index calculus.** Collect relations among small primes, solve a linear system modulo the group order, and use the solution to compute individual logarithms. It is subexponential in $\log m$ and is the reason cryptographic moduli are chosen much larger than $10^9$.
- **Primitive roots and orders.** A primitive root modulo $m$ generates every unit, so its logarithm exists for every target. Finding one requires factoring $\varphi(m)$ and testing candidates; the discrete logarithm itself is the harder half.
- **Other groups.** The same meet-in-the-middle idea applies to elliptic curves, matrix groups and even the nimber field of the hardest Codeforces problem in this family. The group operation changes; the decomposition $x = pn - q$ does not.
- **Multiple targets.** For a fixed base and modulus, the inverse formulation reuses one baby-step table across every target, which replaces $Q$ baby-step tables and $Q$ giant walks with one baby-step table and $Q$ giant walks, saving $Q \sqrt{m}$ table insertions. The reference programs rebuild the table because every query has a different triple.
- **The $0^0$ convention.** Some judges define $0^0 = 1$. That convention matters only when $a = 0$, which the reference contract excludes by requiring $1 \le a$. The worked Library Checker problem includes it.

## Contest strategy

1. Read the modulus and the gcd first. If $\gcd(a, m) = 1$, the plain algorithm applies; otherwise peel the common factor, and remember that the guarantee of a solution is not the same as coprimality.
2. Test $b = 1$ before anything else and print $0$. Then test $b = 0$ with $m > 1$ and print $-1$; a unit never reaches zero.
3. Choose $n = \lceil \sqrt{m} \rceil$ with an integer root. Do not use `floor`, and do not trust a floating-point square root without a correction.
4. Prefer one decomposition and its policy. The reference uses $x = pn - q$ and keeps the largest $q$; the inverse formulation uses $x = pn + q$ and keeps the smallest $q$.
5. Widen the product before the modulo. A modulus below $2^{31}$ fits in 64 bits; a modulus near $10^{18}$ does not. In JavaScript, use `BigInt` for every residue.
6. Watch the top of the giant loop. It must reach $p = n$, because the smallest solution can be as large as $m - 1$.
7. Check the answer with one modular power. A returned exponent that does not satisfy the congruence is a table bug, and the check is cheaper than reading the code.
8. Validate against brute force for every $m$ up to a few hundred and every coprime base. The exhaustive check catches the overwrite policy, the off-by-one block, and the missing zero case in a few seconds.
9. When the problem hides the logarithm inside a recurrence, take the logarithm of the whole relation and work with exponents modulo the group order. That reduction is where the hard problems are won.

## Worked problems

### Problem 1: Hard Equation

**Restatement.** Given $T \le 500$ triples with $0 \le a, b < m \le 10^9$, find any $x$ with $a^x \equiv b \pmod m$. Every test has a solution, and any valid $x$ is accepted.

**Naive baseline.** Scan the powers of $a$ from $x = 0$ upward until $b$ appears. Each query costs up to $m = 10^9$ multiplications, and five hundred queries cost $5 \times 10^{11}$.

**Insight.** Baby-step giant-step solves one query in $O(\sqrt{m})$, and the extended form handles a base that shares a factor with the modulus.

**Derivation.** Peel $g = \gcd(a, m)$ while $g > 1$: if $g \nmid b$, report $-1$; otherwise replace $m$ by $m/g$, replace $b$ by $(b/g) \ast (a/g)^{-1} \bmod (m/g)$, and increment a counter. The inverse exists because $\gcd(a/g, m/g) = 1$. Once $\gcd(a, m) = 1$, run the plain algorithm for $x'$ and return $x' + \text{counter}$. The case $b = 1$ is checked before the peel and returns $0$.

**Correctness.** Each peel is an equivalence: $a^x \equiv b \pmod m$ with $x \ge 1$ holds exactly when $a^{x-1} \equiv (b/g) \ast (a/g)^{-1} \pmod{m/g}$, because dividing by $g$ is exact and $a/g$ is invertible modulo $m/g$. After the last peel the instance is coprime, and the correctness theorem applies to the reduced exponent. Adding the counter restores the original exponent.

**Complexity.** $O(\sqrt{m} \log m)$ per query in the worst case, with the logarithm coming from the inverses, and $O(\sqrt{m})$ memory.

**Common wrong approach.** Running the plain algorithm on $a = 2$, $b = 0$, $m = 4$ returns $1$, but the smallest solution is $2$. The cancellation is invalid because $2$ is not invertible modulo $4$.

### Problem 2: Discrete Logarithm

**Restatement.** Given $T \le 100$ triples with $0 \le X, Y < M \le 10^9$, print the smallest non-negative $K$ with $X^K \equiv Y \pmod M$, or $-1$. The statement defines $0^0 = 1$, and $M$ may be $1$ or composite.

**Naive baseline.** Scan $K$ from $0$ upward and compare powers. The scan is correct but costs up to $M$ multiplications per query.

**Insight.** The only obstruction to the plain algorithm is a common factor between the base and the modulus. Peeling removes it, and three boundary cases ($M = 1$, $X = 0$ with $Y = 1$, and $X = 0$ with $Y = 0$) are decided directly.

**Derivation.** If $M = 1$, every power is $0$ modulo $1$, so $K = 0$ works and the answer is $0$. If $X = 0$, the convention gives $0^0 = 1$, so $Y = 1$ gives $0$ and $Y = 0$ gives $1$; every other target gives $-1$. Otherwise, if $Y = 1$, return $0$. Peel $\gcd(X, M)$ as in Problem 1 until the base and the modulus are coprime, then run baby-step giant-step and add the number of peels.

**Correctness.** The boundary cases follow from the definition and the stated convention. For the remaining cases, each peel is an equivalence as in Problem 1, and the plain algorithm returns the smallest reduced exponent; adding the peel count gives the smallest original exponent because every solution with $x \ge 1$ must survive the same number of peels.

**Complexity.** $O(\sqrt{M} \log M)$ per query and $O(\sqrt{M})$ memory. The modulus is at most $10^9$, so the table is at most $31\,623$ entries.

**Common wrong approach.** Applying the plain algorithm to $X = 2$, $Y = 0$, $M = 4$ returns $1$, but $2^1 = 2$ and the correct answer is $2$. The false match is exactly the non-coprime cancellation described above.

### Problem 3: Lunar New Year and a Recursive Sequence

**Restatement.** Let $p = 998\,244\,353$. A sequence satisfies

$$
f_i = \prod_{j=1}^{k} f_{i-j}^{b_j} \bmod p
$$

for $i > k$, with $f_1 = \cdots = f_{k-1} = 1$ and $f_n = m$. Given $k \le 100$, the exponents $b_j$, and $n \le 10^9$, find any $f_k$ in $[1, p)$, or $-1$.

**Naive baseline.** Try every candidate $f_k$ in $[1, p)$, simulate $n$ terms with a $k$-term product, and check the last term. That is about $p \ast n \ast k$ multiplications, which is far beyond the limit.

**Insight.** The recurrence multiplies powers, so it is linear in the exponents. Let $g = 3$ be a primitive root modulo $p$ and write $f_i = g^{e_i}$. Then $e_i = \sum_j b_j e_{i-j} \pmod{p-1}$, the initial exponents $e_1, \ldots, e_{k-1}$ are $0$, and the unknown is $e_k = y$. The $n$-th exponent is $e_n = c y \bmod (p-1)$ for a coefficient $c$ produced by the same linear recurrence.

**Derivation.** Compute $c$ with matrix exponentiation on the $k \times k$ companion matrix, reduced modulo $p - 1$; it is the top-left entry of the $(n-k)$-th power. Compute $y_m = \log_g m$ by baby-step giant-step. Solve the linear congruence $c y \equiv y_m \pmod{p-1}$: with $d = \gcd(c, p-1)$, a solution exists exactly when $d \mid y_m$, and one solution is $y = (y_m/d) \ast (c/d)^{-1} \bmod ((p-1)/d)$. Output $g^y \bmod p$.

**Correctness.** Because $g$ is a primitive root, the map $y \mapsto g^y$ is a bijection from $[0, p-1)$ to the nonzero residues, so exponent arithmetic modulo $p-1$ is equivalent to multiplication modulo $p$. The recurrence on the exponents is the logarithm of the stated recurrence. The linear congruence has a solution exactly when the sequence can reach $m$, and the returned $g^y$ reproduces the required $n$-th term.

**Complexity.** $O(k^3 \log n + \sqrt{p})$ time and $O(k^2)$ memory. For $k = 100$ and $p = 998\,244\,353$, the matrix part is about $3 \times 10^7$ operations and the table has $31\,596$ entries.

**Common wrong approach.** Reducing the exponents modulo $p$ instead of $p - 1$. Fermat's little theorem gives $g^{p-1} \equiv 1$, so the exponent lives modulo $p-1$; using $p$ makes every coefficient wrong. A second wrong approach solves the linear congruence without the gcd condition and reports a value when $d \nmid y_m$.

## Practice progression

1. **Recognition.** Given a statement, decide whether it asks for a power, a logarithm, an order, or a primitive root. Only the second one is this technique.
2. **Direct application.** Implement the inverse-free baby-step giant-step for coprime triples, then check it against a brute force for every $m$ from $2$ to $200$ and every coprime $a$.
3. **Policy and boundaries.** Add the $b = 1$ case, the $b = 0$ case, the composite modulus, and the exact block size. Re-run the exhaustive check after each change.
4. **Adaptation.** Implement the extended version that peels the gcd, and test it on $a = 2$, $b = 0$, $m = 4$ and on the Library Checker boundary cases with $m = 1$ and $a = 0$.
5. **Combination.** Solve a recurrence hidden behind products by taking logarithms, computing a coefficient with matrix exponentiation, and solving a linear congruence. This is the Lunar New Year problem.
6. **Transfer.** Recognize the same meet-in-the-middle split in a subset-sum meet-in-the-middle, in an elliptic-curve key-exchange exercise, and in a multiplicative-order problem that factors $\varphi(m)$ instead of scanning exponents.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. State the definition of the discrete logarithm and the condition under which it exists. (Formal model)
2. Why does the order of $a$ exist exactly when $\gcd(a, m) = 1$, and why is it at most $\varphi(m)$? (Formal model)
3. Derive the identity $a^{pn} \equiv b a^q$ from $x = pn - q$. (Key insight)
4. Why must the table store the largest $q$ in the subtractive decomposition? (Key insight)
5. Trace the algorithm on $a = 3$, $b = 5$, $m = 7$ and on $a = 2$, $b = 3$, $m = 9$. (Step-by-step execution)
6. Prove that the first matching giant step returns the smallest exponent. (Correctness proof)
7. Why is $n = \lceil \sqrt{m} \rceil$ sufficient, and what breaks with $\lfloor \sqrt{m} \rfloor$? (Algorithm derivation)
8. What is the smallest non-coprime triple for which the plain algorithm returns a false solution, and why does the cancellation fail? (Common mistakes)
9. How does the extended algorithm remove a common factor, and what happens to the exponent? (Variants and extensions)
10. When is an order computation cheaper than a discrete logarithm, and when is Pohlig-Hellman the right choice? (Algorithm selection)

## Further reading

- The modular arithmetic that the algorithm reduces after every multiplication, including binary exponentiation and Fermat's little theorem, is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The inverse of a residue modulo a composite modulus, which the classic formulation and the peel both need, is in [extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean).
- The group order that bounds the exponent, and the theorem that produces it, are in [Euler's totient function and Euler's theorem](/algorithms/number-theory/euler-totient).
- The matrix power that computes the coefficient of the recurrence in the hardest worked problem is in [matrix exponentiation](/algorithms/number-theory/matrix-exponentiation).
- The combination of congruences modulo coprime factors, which the order and Pohlig-Hellman variants use, is in [Chinese remainder theorem](/algorithms/number-theory/chinese-remainder).
- The factorization that finds orders and primitive roots, and the sieve that answers the small-query version, are in [prime factorization](/algorithms/number-theory/prime-factorization) and [sieve of Eratosthenes](/algorithms/number-theory/sieve).
- The monotone search that finds a boundary in logarithmic time, which is the other standard way to avoid a linear scan, is in [binary search](/algorithms/searching/binary-search).
- The divisibility, gcd and proof techniques that the lemmas rely on are in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The subject index places this technique beside the arithmetic it builds on in [number theory](/algorithms/number-theory/).
- The original algorithm is D. Shanks, "Class number, a theory of factorization, and genera" (1971). The standard reference for the analysis and the extensions is Crandall and Pomerance, _Prime Numbers: A Computational Perspective_; the competitive-programming presentation is in the [cp-algorithms article on discrete logarithms](https://cp-algorithms.com/algebra/discrete-log.html).
