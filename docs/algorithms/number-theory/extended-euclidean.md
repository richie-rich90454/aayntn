---
id: number-theory.extended-euclidean
title: The extended Euclidean algorithm
summary: Compute the greatest common divisor of two integers together with the coefficients that express it as a linear combination of them, and use those coefficients to compute a modular inverse.
division: [silver, gold]
subjects: [number-theory]
level: intermediate
importance: common-contest-technique
keywords:
    [
        extended euclidean algorithm,
        bezout identity,
        modular inverse,
        gcd,
        linear diophantine equation,
        coefficient recovery,
        continued fraction,
    ]
prerequisites:
    required: [foundations.complexity, number-theory.modular-arithmetic]
    recommended:
        [foundations.recursion, foundations.binary-representation, number-theory.modular-arithmetic]
complexity:
    time: "O(log min(a, b))"
    space: "O(1)"
assumptions:
    - The inputs are integers, and the modulus, when there is one, is positive.
    - Every intermediate value fits in the type holding it, which for the coefficients means a 64-bit integer for 64-bit inputs.
    - A modular inverse is only requested for a value that is coprime to the modulus, or the program checks the gcd and reports the failure.
reviewed: false
---

## At a glance

The Euclidean algorithm computes the greatest common divisor of two integers by repeated division. The **extended** Euclidean algorithm computes it together with the two coefficients that express it as a linear combination of the inputs, and those coefficients are the answer to a family of problems.

For inputs $a$ and $b$ with $\gcd(a, b) = g$, the algorithm returns integers $x$ and $y$ such that

$$
ax + by = g.
$$

This is the **Bezout identity**, and it is the form of the result that carries the extra information.

Three problems follow immediately.

- The **modular inverse** of $a$ modulo $m$ is the value of $x$ with $ax \equiv 1 \pmod m$, and it exists exactly when $\gcd(a, m) = 1$. The inverse is $x \bmod m$.
- The **linear Diophantine equation** $ax + by = c$ is solvable exactly when $g$ divides $c$, and the solutions are $x = x_0 + (b/g)t$ and $y = y_0 - (a/g)t$.
- The **modular division** $c / b \pmod m$, when $b$ is invertible, is $c \cdot b^{-1} \bmod m$.

The cost is $O(\log \min(a, b))$ iterations, and the coefficients are recovered along the way by a recurrence that is two subtractions per step.

## Problem motivation

A problem asks for the value of $3^{-1} \pmod{11}$, that is, for the integer $x$ with $0 \le x < 11$ and $3x \equiv 1 \pmod{11}$. The answer is $4$, since $3 \cdot 4 = 12 \equiv 1$.

The naive approach searches. It tries $x = 0, 1, 2, \ldots$ until $ax \bmod m = 1$, which takes up to $m$ trials. When the modulus is $10^9 + 7$ and there are many queries, that is $10^9$ operations per query, and the program does not finish.

The second baseline is Fermat's little theorem, which says that for a prime modulus $p$ and a nonzero $a$,

$$
a^{-1} \equiv a^{p-2} \pmod p.
$$

With binary exponentiation that is $O(\log p)$ modular multiplications, about $30$ for a modulus of $10^9 + 7$, which is fast. It is also restricted: it needs the modulus to be prime, and the problem statement does not always promise that.

The extended Euclidean algorithm needs no primality assumption at all. It costs $O(\log \min(a, b))$ iterations, it works for a composite modulus, and it produces the inverse and the general solution of the linear Diophantine equation as by-products.

The count of iterations is worth appreciating. The remainders of the Euclidean algorithm fall at least as fast as the Fibonacci numbers, so the number of iterations is at most about $1.44 \log_2 \min(a, b)$, which is $92$ for 64-bit inputs. The algorithm is logarithmic, not linear, and it never grows the numbers it works with.

## Recognition patterns

The extended Euclidean algorithm is the right tool when all of the following hold.

- The problem asks for a **modular inverse**, or for the **coefficients** of a greatest common divisor, or for the **solution of a linear Diophantine equation**.
- The modulus is **not guaranteed to be prime**, so that Fermat's little theorem does not apply.
- The numbers are **large**, so that a search is too slow and a trial division is too slow.

The constraint values that rule the technique in and out:

| Constraint | What it rules |
| --- | --- |
| The modulus is a prime and there is one query | Fermat's little theorem with binary exponentiation is shorter |
| The modulus is prime and there are many queries | The extended Euclidean algorithm is faster per query |
| The modulus is composite | Rules out Fermat; the extended Euclidean algorithm applies |
| The modulus is $1$ | The inverse does not exist in any useful sense |
| The inputs are at most $10^6$ | A search over the residues is competitive for a single query |
| The inputs are at most $10^{18}$ | The extended Euclidean algorithm is required |
| The problem asks for the gcd alone | The ordinary Euclidean algorithm is shorter |

The third row is the important one. Many statements say "for a prime $p$" for one part of the problem and "for a modulus $m$" for another, and the second part needs the extended algorithm.

The last row is a distinction worth keeping. The ordinary Euclidean algorithm is four lines, and when the problem asks only for a gcd, using the extended version is a small waste of a few multiplications. It is never a wrong choice, though, and many implementations of the extended version return the gcd as well, so the two collapse into one function.

## Naive approach

The baseline is the ordinary Euclidean algorithm.

```python
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a
```

This is correct, and it is $O(\log \min(a, b))$ iterations. It does not give the coefficients.

The second baseline is the search for the inverse.

```python
def inverse_by_search(a, m):
    a %= m
    for x in range(m):
        if (a * x) % m == 1:
            return x
    return None
```

This is correct, and it is $O(m)$, which is too slow for a large modulus. It also silently fails to distinguish "the inverse does not exist" from "the search was too slow", which is a real problem when the modulus is composite and $a$ is not coprime to it.

## Key insight

The insight is that **the Euclidean algorithm can be run backwards**.

The ordinary algorithm produces a sequence of remainders

$$
r_0 = a, \quad r_1 = b, \quad r_{i-1} = q_i r_i + r_{i+1},
$$

and the last nonzero remainder is the greatest common divisor. The extended algorithm keeps, alongside each remainder, the two coefficients that express it as a linear combination of the original $a$ and $b$.

The base cases are

$$
r_0 = a = 1 \cdot a + 0 \cdot b,
\qquad
r_1 = b = 0 \cdot a + 1 \cdot b.
$$

And the recurrence follows from the division step. Since $r_{i-1} = q_i r_i + r_{i+1}$, and each remainder is a linear combination of $a$ and $b$, substituting gives

$$
r_{i+1} = r_{i-1} - q_i r_i,
$$

so the coefficients obey the same recurrence:

$$
s_{i+1} = s_{i-1} - q_i s_i,
\qquad
t_{i+1} = t_{i-1} - q_i t_i.
$$

At the end, the last nonzero remainder is the gcd, and its coefficients are the Bezout coefficients.

## Formal model

Let $a$ and $b$ be integers, not both zero, and let $m > 0$ be a modulus.

::: math definition Definition
Two integers $a$ and $b$ are **coprime** when their greatest common divisor is $1$. The **Bezout identity** states that there exist integers $x$ and $y$ with $ax + by = \gcd(a, b)$, and the pair $(x, y)$ is a **Bezout coefficient pair**.
:::

::: math definition Definition
The **modular inverse** of $a$ modulo $m$ is an integer $x$ with $ax \equiv 1 \pmod m$. It exists if and only if $\gcd(a, m) = 1$, and then it is unique modulo $m$.
:::

::: math invariant Invariant
At every moment of the algorithm, each remainder $r_i$ in the sequence satisfies $r_i = s_i a + t_i b$, and the coefficients satisfy $s_{i+1} = s_{i-1} - q_i s_i$ and $t_{i+1} = t_{i-1} - q_i t_i$. When the algorithm stops, the last nonzero remainder is the greatest common divisor, and its coefficients are a Bezout coefficient pair.
:::

::: math lemma Lemma
The extended Euclidean algorithm returns a pair $(x, y)$ with $ax + by = \gcd(a, b)$.
:::

::: math proof Proof
The invariant says that every remainder is a linear combination of $a$ and $b$, and the base cases establish it for the first two remainders. The recurrence for the coefficients is exactly the division step rewritten as $r_{i+1} = r_{i-1} - q_i r_i$, so substituting the expressions for $r_{i-1}$ and $r_i$ gives $r_{i+1} = (s_{i-1} - q_i s_i) a + (t_{i-1} - q_i t_i) b$, which is the expression for the next remainder with the coefficients the recurrence produces. So the invariant holds for every remainder.

The last nonzero remainder is the greatest common divisor, because the ordinary Euclidean algorithm's last nonzero remainder divides every remainder before it, and therefore divides $a$ and $b$; and every common divisor of $a$ and $b$ divides every remainder, and hence divides the last one. So the last nonzero remainder is the greatest common divisor, and by the invariant it equals $s a + t b$ for the coefficients the algorithm returns. $\square$
:::

## Algorithm derivation

### The iterative form

```text
old_r = a, r = b
old_s = 1, s = 0
old_t = 0, t = 1
while r != 0:
    q = old_r / r
    old_r, r = r, old_r - q * r
    old_s, s = s, old_s - q * s
    old_t, t = t, old_t - q * t
return old_r, old_s, old_t
```

The three parallel recurrences are the same computation applied to the remainders and to the two coefficient pairs. The names `old` and `new` are what make the simultaneous assignment necessary: the update of `r` uses the old value of `r`, and the update of `s` uses the old value of `s`.

### The recursive form

```text
extended_gcd(a, b):
    if b == 0:
        return (a, 1, 0)
    (g, x, y) = extended_gcd(b, a mod b)
    return (g, y, x - (a / b) * y)
```

The recursive form is the same algorithm with the return value carrying the coefficients back up the call stack. It is shorter, and the unrolling at the end is exactly the recurrence written backwards.

### From the coefficients to the modular inverse

Suppose the problem asks for the inverse of $a$ modulo $m$, with $\gcd(a, m) = 1$. Run the extended algorithm on $(a, m)$. It returns $(g, x, y)$ with

$$
ax + my = g = 1.
$$

Reducing modulo $m$ gives $ax \equiv 1 \pmod m$, so $x$ is the inverse. The returned $x$ may be negative, so the answer is $x \bmod m$, and the modulus must be chosen so that the result is in $[0, m)$.

### The general linear Diophantine equation

The equation $ax + by = c$ is solvable if and only if $\gcd(a, b)$ divides $c$. When it is solvable, the extended algorithm applied to $(a, b)$ gives a Bezout pair $(x_0, y_0)$ with $ax_0 + by_0 = g$, and then

$$
x = x_0 + \frac{b}{g} t,
\qquad
y = y_0 - \frac{a}{g} t
$$

for every integer $t$.

### The connection to continued fractions

The quotients $q_1, q_2, \ldots$ that the Euclidean algorithm produces are the partial quotients of the continued fraction expansion of $a / b$. The coefficients that the extended algorithm computes are exactly the convergents of that expansion. This is worth knowing because it is the connection that makes the technique feel inevitable rather than clever: the Euclidean algorithm and the continued fraction are two views of the same object, and the extended version is the one that keeps the convergents.

## Step-by-step execution

Take $a = 252$ and $b = 105$. The ordinary Euclidean algorithm gives the remainders $252, 105, 42, 21, 0$, and the gcd is $21$.

The extended algorithm tracks the coefficients alongside them.

| $i$ | $q_i$ | $r_{i-1}$ | $r_i$ | $r_{i+1}$ | $s_{i+1}$            | $t_{i+1}$              |
| --- | ----- | --------- | ----- | --------- | -------------------- | ---------------------- |
| 0   |       | 252       | 105   |           | $1$                  | $0$                    |
| 1   |       | 105       | 42    |           | $0$                  | $1$                    |
| 2   | $2$   | 42        | 21    | $0$       | $1 - 2 \cdot 0 = 1$  | $0 - 2 \cdot 1 = -2$   |
| 3   | $2$   | 21        | $0$   |           | $0 - 2 \cdot 1 = -2$ | $1 - 2 \cdot (-2) = 5$ |

Reading the table row by row.

**The first division.** $252 = 2 \cdot 105 + 42$, so $q_1 = 2$. The new remainder is $42 = 252 - 2 \cdot 105$, and the new coefficients are $s_2 = 1 - 2 \cdot 0 = 1$ and $t_2 = 0 - 2 \cdot 1 = -2$. So $42 = 1 \cdot 252 + (-2) \cdot 105$, and indeed $252 - 210 = 42$.

**The second division.** $105 = 2 \cdot 42 + 21$, so $q_2 = 2$. The new remainder is $21 = 105 - 2 \cdot 42$, and the new coefficients are $s_3 = 0 - 2 \cdot 1 = -2$ and $t_3 = 1 - 2 \cdot (-2) = 5$. So $21 = (-2) \cdot 252 + 5 \cdot 105$, and indeed $-504 + 525 = 21$.

**The third division.** $42 = 2 \cdot 21 + 0$, so $q_3 = 2$, and the new remainder is $0$. The algorithm stops, and the last nonzero remainder is $21$, with the coefficients $x = -2$ and $y = 5$.

The final answer is

$$
\gcd(252, 105) = 21 = (-2) \cdot 252 + 5 \cdot 105.
$$

**The modular inverse.** For the inverse of $252$ modulo $11$, run the algorithm on $(252, 11)$.

| Division                 | Remainder | Coefficients                                   |
| ------------------------ | --------- | ---------------------------------------------- |
| $252 = 22 \cdot 11 + 10$ | 10        | $1 - 22 \cdot 0 = 1$, $0 - 22 \cdot 1 = -22$   |
| $11 = 1 \cdot 10 + 1$    | 1         | $0 - 1 \cdot 1 = -1$, $1 - 1 \cdot (-22) = 23$ |

The last nonzero remainder is $1$, with $x = -1$ and $y = 23$, and indeed $252 \cdot (-1) + 11 \cdot 23 = -252 + 253 = 1$. The inverse of $252$ modulo $11$ is $-1 \bmod 11 = 10$, and $252 \cdot 10 = 2520 = 229 \cdot 11 + 1$.

**The linear Diophantine equation.** For $252x + 105y = 21$, the coefficients $x_0 = -2$ and $y_0 = 5$ are one solution, and all the solutions are

$$
x = -2 + 5t,
\qquad
y = 5 - 12t
$$

for every integer $t$, because $b / g = 105 / 21 = 5$ and $a / g = 252 / 21 = 12$.

## Correctness proof

::: math theorem Theorem
The extended Euclidean algorithm applied to the positive integers $a$ and $b$ returns the greatest common divisor $g$ of $a$ and $b$ and integers $x$ and $y$ with $ax + by = g$.
:::

::: math proof Proof
The proof of the invariant is given in the lemma above: every remainder is a linear combination of $a$ and $b$, and the coefficients obey the recurrence, which is the division step rewritten.

It remains to show that the last nonzero remainder is the greatest common divisor. Let $r_{k}$ be the last nonzero remainder. From the division $r_{k-1} = q_k r_k + 0$, the number $r_k$ divides $r_{k-1}$, and by backward induction $r_k$ divides every earlier remainder, and therefore divides $r_0 = a$ and $r_1 = b$. So $r_k$ is a common divisor of $a$ and $b$.

Conversely, let $c$ be any common divisor of $a$ and $b$. Then $c$ divides $r_0$ and $r_1$, and the division step shows that if $c$ divides $r_{i-1}$ and $r_i$ then it divides $r_{i+1} = r_{i-1} - q_i r_i$. By induction $c$ divides every remainder, and therefore it divides $r_k$.

So $r_k$ is a common divisor and every common divisor divides it, which means $r_k$ is the greatest common divisor. The invariant then gives $r_k = s a + t b$ for the coefficients the algorithm returns. $\square$
:::

::: math theorem Theorem
If $\gcd(a, m) = 1$, the modular inverse of $a$ modulo $m$ is $x \bmod m$, where $(x, y)$ are the coefficients returned by the extended Euclidean algorithm applied to $(a, m)$.
:::

::: math proof Proof
The algorithm returns $x$ and $y$ with $ax + my = 1$. Reducing the equation modulo $m$ gives $ax \equiv 1 \pmod m$, so $x$ is an inverse. Every other inverse $x'$ satisfies $ax' \equiv 1 \equiv ax \pmod m$, and since $\gcd(a, m) = 1$ the number $a$ is invertible modulo $m$, so multiplying by its inverse gives $x' \equiv x \pmod m$. The inverse is therefore unique modulo $m$, and $x \bmod m$ is its representative in $[0, m)$. $\square$
:::

::: math theorem Theorem
The equation $ax + by = c$ has an integer solution if and only if $\gcd(a, b)$ divides $c$, and when it does, all the solutions are $x = x_0 + (b/g)t$ and $y = y_0 - (a/g)t$ for $t \in \mathbb{Z}$, where $(x_0, y_0)$ is a Bezout coefficient pair and $g = \gcd(a, b)$.
:::

::: math proof Proof
If $(x, y)$ is a solution, then $g$ divides $ax + by = c$, so $g$ divides $c$.

If $g$ divides $c$, write $c = g c'$, and let $(x_0, y_0)$ satisfy $ax_0 + by_0 = g$. Then $(x_0, y_0)$ scaled by $c'$ is not quite the solution; instead, the pair $(c' x_0, c' y_0)$ satisfies $a (c' x_0) + b (c' y_0) = c$, so a solution exists.

For the general form, suppose $(x, y)$ and $(x_0, y_0)$ are two solutions. Subtracting gives $a(x - x_0) = -b(y - y_0)$. Write $g = \gcd(a, b)$, $a = g a'$, $b = g b'$ with $\gcd(a', b') = 1$. Then $a'(x - x_0) = -b'(y - y_0)$, and since $a'$ and $b'$ are coprime, $b'$ divides $x - x_0$, so $x - x_0 = b' t$ for some integer $t$, that is, $x = x_0 + (b/g)t$. Substituting back gives $y = y_0 - (a/g)t$. $\square$
:::

## Complexity analysis

| Quantity                 | Cost                              |
| ------------------------ | --------------------------------- |
| Iterations               | $O(\log \min(a, b))$              |
| Work per iteration       | $O(1)$ arithmetic operations      |
| Time                     | $O(\log \min(a, b))$              |
| Space, iterative form    | $O(1)$                            |
| Space, recursive form    | $O(\log \min(a, b))$ stack frames |
| Size of the coefficients | $O(\max(a, b))$ in the worst case |

The iteration bound is the Fibonacci bound. The smallest pair of inputs that forces $k$ iterations is the pair of consecutive Fibonacci numbers, because the quotients are all $1$ and the remainders fall as slowly as possible. Since $F_k \approx \varphi^k / \sqrt 5$ with $\varphi = 1.618$, the number of iterations for 64-bit inputs is at most about $92$.

The size of the coefficients is the practical warning. The Bezout coefficients satisfy $|x| \le b / g$ and $|y| \le a / g$, so for inputs up to $10^{18}$ they fit in a 64-bit integer. Their **product** does not: $x \cdot y$ can be of size $10^{36}$, which needs 128 bits. A program that computes $x \cdot y$ in 64-bit arithmetic overflows silently.

The time bound is in arithmetic operations. Each operation is a division or a multiplication on machine integers, so the running time is $O(\log \min(a,b))$ machine operations, which is at most a few hundred.

## Algorithm selection

| Situation | What to use |
| --- | --- |
| The modular inverse, with a prime modulus | Fermat's little theorem with binary exponentiation |
| The modular inverse, with a composite modulus | The extended Euclidean algorithm |
| The modular inverse, with a prime modulus and many queries | The extended Euclidean algorithm, which is faster per query |
| The gcd alone | The ordinary Euclidean algorithm |
| The Bezout coefficients | The extended Euclidean algorithm |
| The solution of $ax + by = c$ | The extended Euclidean algorithm |
| The inverse of a number modulo $2^{64}$ | The Newton iteration, which is faster still |
| A number of size $10^{18}$, primality | A Miller-Rabin test, not a gcd |

The first row is the one that decides between the two techniques. Fermat's little theorem needs a prime modulus and about $30$ modular multiplications for a modulus of $10^9 + 7$. The extended Euclidean algorithm needs no primality assumption and about $20$ divisions for the same size. When the modulus is known to be prime, either works, and Fermat's is the more commonly recognized.

The seventh row is worth a mention. The inverse of an odd number modulo $2^{64}$ can be computed by the Newton iteration $x \gets x (2 - ax)$, which doubles the number of correct bits at every step, so it takes $6$ steps for $64$ bits. It is the fastest way to compute an inverse modulo a power of two, and it is a special case of Hensel lifting.

## Recursion decision

This is the one technique in this encyclopedia where the recursive form is genuinely attractive, and the reason is the depth.

The recursion depth of the extended Euclidean algorithm is the number of iterations, which is at most about $92$ for 64-bit inputs. That is comfortably inside every limit, including Python's default of $1000$.

| Language | Practical depth | Recommendation |
| --- | --- | --- |
| C and C++ | About $10^5$ frames on an 8 MB stack | Either; the recursive form is clearer |
| Java | About $10^4$ frames | Either |
| Python | The interpreter limit of $1000$ | Either; the depth of $92$ is well inside the limit |
| Pascal | The operating system stack | Either |
| JavaScript | About $10^4$ frames | Either |

So the recommendation is that both forms are safe, and the choice is between clarity and speed.

The **recursive** form is the one to write first, because it is four lines and because the unrolling of the recurrence at the end of each frame is exactly the coefficient update written out. It is also the form that appears in most textbooks, and recognizing it in a solution is useful.

The **iterative** form is the one to write when the function is called in a hot loop, or when the language's stack is a concern for other reasons. It uses $O(1)$ space instead of $O(\log \min(a,b))$, and it has no risk of a stack overflow under any circumstances.

There is one case where the recursive form is a mistake: when the inputs are not bounded by a machine word. An implementation that takes the inputs as arbitrary-precision integers, or that recurses on a chain of remainders whose count is not logarithmic, can overflow. That does not arise in a contest, and it is worth mentioning only because the extended algorithm is sometimes used as a subroutine in algorithms that do have unbounded depth.

## Implementation walkthrough

The simultaneous update is the line that matters, and it is easy to write wrongly.

```cpp
// the iterative form
long long old_r = a, r = b;
long long old_s = 1, s = 0;
long long old_t = 0, t = 1;
while (r != 0) {
    long long q = old_r / r;
    long long next_r = old_r - q * r;
    long long next_s = old_s - q * s;
    long long next_t = old_t - q * t;
    old_r = r;  r = next_r;
    old_s = s;  s = next_s;
    old_t = t;  t = next_t;
}
```

Writing the three updates in sequence rather than as a simultaneous assignment is the mistake, because the update of `s` needs the old value of `s` and the update of `r` needs the old value of `r`. The version above uses temporaries, which is the clearest way to say that.

The division is the second detail.

```cpp
long long q = old_r / r;
long long next_r = old_r - q * r;
```

Computing the remainder as `old_r - q * r` rather than as `old_r % r` is a choice, and it is the right one in the languages where the division truncates toward zero, because the identity $a = q b + (a - q b)$ holds exactly with the truncated quotient. In a language with a floored division, the identity still holds, but the sign of the remainder differs from the sign that the language's `%` produces, and the two choices are not interchangeable when the inputs have different signs.

The reduction of the answer is the third detail.

```cpp
long long inverse(long long a, long long m) {
    long long g = extended_gcd(a, m);   // returns the coefficients
    if (g != 1) return -1;              // the inverse does not exist
    return (x % m + m) % m;             // the second % m handles a negative x
}
```

The double reduction is not optional in C, C++, and Java, where the remainder of a negative dividend is negative. The expression `x % m + m` alone is not enough either, because if $x$ is already nonnegative and less than $m$, then $x \% m + m = x + m$, which is out of range. The double reduction normalizes into $[0, m)$ in every case.

The check on the gcd is the fourth detail, and it is what turns a wrong answer into a reported failure. A composite modulus and a value that is not coprime to it have no inverse, and a program that computes the Bezout coefficient anyway reports a number that is not an inverse.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Swapping the returned coefficients | The answer is the coefficient of the wrong input | Remember that $x$ multiplies $a$ and $y$ multiplies $b$ |
| Returning a negative inverse | The answer is out of range | Reduce with `(x % m + m) % m` |
| Not checking the gcd | A non-invertible input produces a wrong answer | Return a failure when the gcd is not $1$ |
| Using Fermat's little theorem on a composite modulus | The answer is wrong | Use the extended algorithm, or check the primality |
| Updating the coefficients in sequence | The second update uses the new value of the first | Use temporaries, or a simultaneous assignment |
| Overflowing in `x * y` | A silent wrong answer in a computation that uses both | Use 128-bit arithmetic for the product |
| Assuming the inputs are positive | The sign convention changes | Normalize the signs at the start |
| Dividing by zero in the last step | A crash | The loop stops when the remainder is zero, before the division |

### Why this fails: the inverse that keeps its sign

The plausible wrong approach is to reduce the Bezout coefficient with the language's remainder operator and trust that the result is in $[0, m)$. In most programming languages the remainder operator returns a value with the sign of the dividend, so a negative coefficient stays negative, and the program prints a negative number for an inverse.

The smallest counterexample is the inverse of $2$ modulo $5$.

The extended algorithm on $(2, 5)$ gives $5 = 2 \cdot 2 + 1$, and back-substituting gives $1 = 5 - 2 \cdot 2$, so the Bezout pair is $x = -2$, $y = 1$. Indeed $2 \cdot (-2) + 5 \cdot 1 = -4 + 5 = 1$.

The correct inverse is $3$, because $2 \cdot 3 = 6 \equiv 1 \pmod 5$.

The buggy program computes `(-2) % 5`, which in C, C++, and Java is $-2$ and in Python is $3$. So the C, C++, and Java version of the bug prints $-2$ and the Python version prints $3$ and is accidentally right. The inverse of $2$ modulo $5$ is $3$, and the correct test is $2 \cdot 3 = 6 \equiv 1 \pmod 5$, while $2 \cdot (-2) = -4 \equiv 1$ as well. So the value $-2$ is a genuine inverse in the sense of the congruence; it is simply not the representative the problem asks for.

The mechanism is exact. The Bezout coefficient can be negative, and the problem asks for the representative in $[0, m)$. The sign of the remainder operator's result is the sign of the dividend, so a negative coefficient is not normalized by the operator.

The fix is the double reduction $(x \% m + m) \% m$, which maps every integer into $[0, m)$ regardless of its sign.

The same failure has a second form. A program that reports the inverse as $-2$ and then uses it in a modular multiplication is still correct, because the congruence is what matters. A program that prints it is wrong, because the problem asked for a number in a range. The two failures look identical and are not, and the difference is exactly the range convention.

The lesson generalizes: **a residue has a canonical representative, and the language's remainder operator is not it.** Reducing a residue into $[0, m)$ is a step that has to be written down, and writing it down once in a helper function is the right way to make sure it is done.

## Variants and extensions

- **The extended Euclidean algorithm for several numbers.** The gcd of $n$ numbers and a Bezout combination of all of them is computed by folding the pairwise algorithm, and the coefficients of the later numbers are added in.
- **The modular inverse modulo a power of two.** The Newton iteration $x \gets x(2 - ax)$ doubles the number of correct bits at every step, so $6$ steps suffice for $64$ bits. It is the fastest inverse there is for this case.
- **The inverse of a matrix modulo a prime.** The extended algorithm is applied to a cofactor expansion, and the inverse exists exactly when the determinant is not divisible by the prime.
- **The Chinese remainder theorem.** The extended algorithm computes the inverses needed to combine the solutions modulo the pairwise coprime prime powers.
- **The continued fraction expansion.** The quotients of the Euclidean algorithm are the partial quotients, and the Bezout coefficients are the convergents. The two are two views of the same object.
- **The rational reconstruction.** The Bezout coefficients give a way to recover a rational number $p / q$ from the value $p \bmod q$, which is the basis of several algorithms in computational number theory.
- **The linear Diophantine equation in two variables.** The general solution, which the theorem of the correctness proof gives.
- **The modular division.** Dividing by $b$ modulo $m$ is multiplying by the inverse of $b$, which exists exactly when $\gcd(b, m) = 1$.

## Contest strategy

1. Decide between the extended Euclidean algorithm and Fermat's little theorem before writing code. Fermat is shorter and needs a prime modulus; the extended algorithm needs no assumption and answers more questions.
2. Write down which coefficient belongs to which input. The extended algorithm on $(a, b)$ returns $x$ for $a$ and $y$ for $b$, and the two are easy to swap.
3. Normalize the inverse into $[0, m)$ with the double reduction, and do it in one helper function.
4. Check the gcd when an inverse is requested. A composite modulus makes the failure mode silent, and a program that reports an inverse where none exists is wrong.
5. Use 64-bit integers for the coefficients, and 128 bits if the program multiplies them.
6. Normalize negative inputs at the start, so that the sign convention never comes up.
7. Write the recursive form first for clarity, and the iterative form if the function is called in a loop.
8. Remember that the extended algorithm answers three questions at once: the gcd, the Bezout coefficients, and the inverse. Use the one that the problem asks for and ignore the rest, rather than writing a separate function for each.

## Worked problems

### Problem 1: the modular inverse

**Restatement.** Given $a$ and a modulus $m$ with $1 \le a < m \le 10^{18}$, report the inverse of $a$ modulo $m$, that is, the integer $x$ with $0 \le x < m$ and $ax \equiv 1 \pmod m$, or report $-1$ if no such integer exists.

**Naive baseline.** Search the residues, which is $O(m)$ and reaches $10^{18}$ trials.

**Insight.** The Bezout identity turns the congruence into an equality, and the Euclidean algorithm produces the identity.

**Derivation.** Run the extended algorithm on $(a, m)$. It returns $g$, $x$, and $y$ with $ax + my = g$. If $g \ne 1$, no inverse exists, and the answer is $-1$. Otherwise the answer is $(x \% m + m) \% m$.

**Correctness.** The theorem of the correctness proof shows that $ax \equiv 1 \pmod m$ exactly when $g = 1$, and that the inverse is unique modulo $m$, so the normalized $x$ is the unique answer in $[0, m)$.

**Complexity.** $O(\log \min(a, m))$ time and $O(1)$ space in the iterative form. At $10^{18}$ that is at most $92$ iterations.

**Common wrong approach.** Returning $x$ without normalizing it, which prints $-2$ instead of $3$ for the inverse of $2$ modulo $5$ in C, C++, and Java.

### Problem 2: the linear Diophantine equation

**Restatement.** Given integers $a$, $b$, and $c$ with $1 \le a, b \le 10^9$, report whether $ax + by = c$ has an integer solution, and if it does, report one.

**Naive baseline.** Search for $x$ in a range and test whether $c - ax$ is divisible by $b$, which is $O(b)$.

**Insight.** The equation is solvable exactly when the gcd divides $c$, and a Bezout pair scaled by $c / g$ is a solution.

**Derivation.** Run the extended algorithm on $(a, b)$ to get $g$, $x_0$, and $y_0$. If $g \nmid c$, report that there is no solution. Otherwise, the solution is $x = (c / g) x_0$ and $y = (c / g) y_0$.

**Correctness.** The theorem of the correctness proof shows that solvability is equivalent to $g \mid c$, and that the displayed pair satisfies the equation, because $a (c/g) x_0 + b (c/g) y_0 = (c/g) g = c$.

**Complexity.** $O(\log \min(a, b))$ time and $O(1)$ space.

**Common wrong approach.** Swapping the two coefficients, which produces a pair that does not satisfy the equation whenever $a \ne b$. The check $a \cdot x + b \cdot y = c$ catches it immediately.

### Problem 3: the division modulo a composite

**Restatement.** Given $a$, $b$, and $m$ with $1 \le a, b, m \le 10^9$, report the value of $a \cdot b^{-1} \pmod m$, that is, the integer $x$ with $0 \le x < m$ and $bx \equiv a \pmod m$, or report $-1$ when $b$ is not invertible modulo $m$.

**Naive baseline.** Search for the inverse of $b$ and multiply, which is $O(m)$.

**Insight.** The equation $bx \equiv a \pmod m$ is the linear congruence $bx - a = km$, and it is solvable exactly when $\gcd(b, m)$ divides $a$.

**Derivation.** Run the extended algorithm on $(b, m)$ to get $g$, $x_0$, and $y_0$ with $b x_0 + m y_0 = g$. If $g \nmid a$, there is no solution. Otherwise, divide the Bezout identity by $g$ and multiply it by $a$:

$$
b \left(\frac{a x_0}{g}\right) + m \left(\frac{a y_0}{g}\right) = a,
$$

so the answer is $(a x_0 / g)$ reduced into $[0, m)$.

**Correctness.** The congruence $bx \equiv a \pmod m$ holds exactly when $m$ divides $bx - a$, that is, when $bx - a = km$ for some integer $k$, that is, when the equation $bx + m(-k) = a$ has an integer solution. By the theorem of the correctness proof, that equation is solvable exactly when $g = \gcd(b, m)$ divides $a$. When it is, the identity above shows that $x = a x_0 / g$ satisfies the equation, and therefore the congruence.

**Complexity.** $O(\log \min(b, m))$ time and $O(1)$ space.

**Common wrong approach.** Assuming the inverse exists because the modulus is large, which is false for a composite modulus. The modulus $12$ and the value $8$ have $\gcd = 4$, so no inverse exists, and a program that does not check reports a number that does not satisfy the congruence.

## Practice progression

1. **Recognition.** Given a statement, decide whether it wants a gcd, an inverse, a Bezout pair, or the solution of a linear Diophantine equation, and write down the one call that produces it.
2. **Direct application.** Implement the iterative and the recursive forms, and check that they agree with each other and with the ordinary Euclidean algorithm on a thousand random pairs.
3. **Adaptation.** Write the version that returns the general solution of $ax + by = c$, the version that returns the modular inverse, and the version that solves a linear congruence.
4. **Combination.** Combine the extended algorithm with a [sieve](/algorithms/number-theory/sieve) to compute the inverses of all the units modulo a prime, and with a [Fenwick tree](/algorithms/range-queries/fenwick-tree) for a version that answers many inverses at once.
5. **Challenge.** Implement the Newton iteration for the inverse modulo $2^{64}$ and compare its running time with the extended algorithm's.
6. **Transfer.** Recognize an extended Euclidean problem in a different shape: the Chinese remainder theorem, the modular inverse in a finite field, the discrete logarithm in its simplest form, or the inverse of a matrix modulo a prime.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses).

1. What does the extended Euclidean algorithm return, and what is the Bezout identity? (Formal model)
2. State the invariant of the algorithm. (Formal model)
3. How are the coefficients recovered from one step to the next? (Algorithm derivation)
4. Why does the last nonzero remainder equal the greatest common divisor? (Correctness proof)
5. How does the Bezout pair give the modular inverse, and when does the inverse exist? (Algorithm derivation)
6. What is the general solution of $ax + by = c$, and when is it solvable? (Correctness proof)
7. How many iterations does the algorithm take for 64-bit inputs, and why? (Complexity analysis)
8. Why is the recursive form safe in every language here? (Recursion decision)
9. What is the smallest counterexample that breaks the sign of the inverse? (Common mistakes)
10. What is the danger of computing $x \cdot y$ in 64-bit arithmetic? (Complexity analysis)
11. When is Fermat's little theorem the better choice? (Algorithm selection)

## Further reading

- The subject index lists this technique, [the extended Euclidean algorithm](/algorithms/number-theory/extended-euclidean), beside the other number theory articles.
- The subject overview, which lists the number theory techniques that are not yet covered, is at [the number theory](/algorithms/number-theory/).
- The arithmetic that the inverse is used inside is in [modular arithmetic](/algorithms/number-theory/modular-arithmetic).
- The primes that the trial division baseline needs are produced by [the sieve of Eratosthenes](/algorithms/number-theory/sieve).
- The recursion whose depth the recursive form uses is described in [recursion](/algorithms/foundations/recursion).
- The discrete mathematics behind the divisibility and the partial orders is in [discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics).
- The bit arithmetic that the Newton iteration and the power-of-two inverse use is in [binary representation](/algorithms/foundations/binary-representation).
