---
id: start.discrete-mathematics
title: Discrete mathematics
summary: The counting, logic and number-theoretic arguments that competitive programming problems use without announcing them.
division: []
subjects: [foundations, number-theory, combinatorics]
level: introductory
importance: core-prerequisite
keywords: [induction, pigeonhole, binomial, modular arithmetic, gcd, expectation]
prerequisites:
    required: []
    recommended:
        [start.from-ap-csa, number-theory.modular-arithmetic, combinatorics.binomial-coefficients]
reviewed: false
draft: false
---

Part 3 is the mathematics that contest problems assume you have and never state. A problem asks for the number of ways to seat people and expects you to recognize a factorial. A problem says "two of these are equal" and expects you to reach for the pigeonhole principle. A problem asks you to compute something modulo a prime and expects you to know that division modulo a prime is multiplication by an inverse.

None of this is hard once you have seen it. All of it is fatal once you have not.

The twelve modules below cover sets and functions, logic, quantifiers, proof techniques, summation, combinatorics, modular arithmetic, the greatest common divisor, probability, and counting arguments.

<Synonyms terms="discrete math, combinatorics and number theory, counting arguments, olympiad math, proof techniques" />

## 3.1 Sets, relations and functions

A **set** is an unordered collection of distinct objects. The objects are its _elements_. Braces denote a set, order does not matter, and repetition does not matter: $\{1, 2, 2, 3\}$ and $\{3, 2, 1\}$ are the same set.

The basic operations:

| Operation            | Notation        | Meaning                       |
| -------------------- | --------------- | ----------------------------- |
| Union                | $A \cup B$      | in $A$ or in $B$, or both     |
| Intersection         | $A \cap B$      | in both                       |
| Difference           | $A \setminus B$ | in $A$ and not in $B$         |
| Symmetric difference | $A \triangle B$ | in exactly one                |
| Complement           | $A^c$           | not in $A$                    |
| Power set            | $2^A$           | the set of all subsets of $A$ |

A **relation** from $A$ to $B$ is a subset of $A \times B$. A **function** from $A$ to $B$ is a relation with the extra property that every element of $A$ is related to exactly one element of $B$. The domain is $A$, the codomain is $B$, and the image is the set of values actually taken.

Three properties classify functions:

- **Injective** (one-to-one): distinct inputs have distinct outputs. Then $|A| \le |B|$.
- **Surjective** (onto): every element of $B$ is the image of some element of $A$. Then $|A| \ge |B|$.
- **Bijective**: both, which forces $|A| = |B|$.

<MathPanel type="definition" title="Function">
A function $f : A \to B$ is a relation in which every $a \in A$ is
associated with exactly one $f(a) \in B$. The set $A$ is the domain, $B$
is the codomain, and $f(A) \subseteq B$ is the image. A function is
injective when $f(a) = f(a')$ implies $a = a'$, and surjective when
$f(A) = B$.
</MathPanel>

**Why it matters.** Modeling a problem as a function is the central skill. A disjoint set union maintains a function from each element to the representative of its component. A hash table maintains a function from each key to the bucket that key lands in, and that function is generally _not_ injective, which is exactly why a hash table can suffer collisions. A graph is a relation, and a directed graph is a relation that need not be a function.

**Worked example.** Consider the problem of assigning each of $n$ students to one of $m$ project groups, with every group non-empty. The assignment is a function from students to groups, and the requirement that every group is non-empty says the function must be surjective. Such a function exists only when $n \ge m$. If additionally each group must receive at most two students, the assignment is an injection into the pairs of students, which changes the counting entirely.

**What you must get right.** Injective and surjective are not synonyms and neither is "one-to-one correspondence" in casual use. Read the definition, not the mnemonic, and check the cardinalities before you count.

### Checkpoint

**Conceptual.**

1. State the definitions of injective, surjective and bijective, and explain what each one says about the cardinalities of the domain and the codomain.
2. Give a relation that is not a function, and a function that is neither injective nor surjective. Which contest structure does each resemble?
3. Explain why a hash table's key-to-bucket mapping is generally not injective, and what follows from that for collisions.

**Code reading.**

1. This function maps each element of a set to the representative of its connected component. Say whether it is injective, surjective, or both, and in which direction:

    ```cpp
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    ```

2. This function maps each key to its bucket index. Say whether it is injective, and what property of the hash function would make it so:

    ```cpp
    int bucket(const std::string& key) {
        unsigned h = 0;
        for (char c : key) h = h * 31u + static_cast<unsigned>(c);
        return h % table_size;
    }
    ```

**Implementation.** Write a function that, given two lists of the same length, determines whether the second list is a permutation of the first, using a frequency table of size bounded by the value range. State the time and space complexity, and say what changes if the values are arbitrary 64-bit integers.

**Applied problem.** A problem asks you to place $n$ students into $m$ groups with every group non-empty and no group larger than two. State the conditions on $n$ and $m$ under which this is possible at all, and give the number of assignments when it is.

## 3.2 Logical implication and equivalence

A statement $P \to Q$ reads "if $P$ then $Q$". It is _false_ only in one case: when $P$ is true and $Q$ is false.

<MathPanel type="definition" title="Implication">
$P \to Q$ is false exactly when $P$ is true and $Q$ is false. In every
other case it is true.
</MathPanel>

From an implication you can form four related statements:

| Statement           | Name                    |
| ------------------- | ----------------------- |
| $Q \to P$           | the converse            |
| $\neg Q \to \neg P$ | the contrapositive      |
| $\neg P \to \neg Q$ | the inverse             |
| $P \leftarrow Q$    | the reverse implication |

The **contrapositive** is always logically equivalent to the original implication. The converse is not: it happens to be equivalent for some statements and not for others, and the difference is exactly the kind of mistake that appears in a competition proof.

<MathPanel type="counterexample" title="The converse need not hold">
The statement "if $n > 2$ then $n$ is composite" is false, because $5 >
2$ and $5$ is prime. Its converse, "if $n$ is composite then $n > 2$",
is true for every positive composite integer. So the implication and its
converse have different truth values, and an argument that swaps them is
invalid.
</MathPanel>

Two statements are **logically equivalent** when they have the same truth value for every assignment of truth values to their atoms. The equivalences you will use constantly are:

$$
\begin{aligned}
P \to Q &\equiv \neg P \lor Q, \\
P \land Q &\equiv \neg(\neg P \lor \neg Q), \\
P \lor Q &\equiv \neg(\neg P \land \neg Q), \\
P \to Q &\equiv \neg Q \to \neg P.
\end{aligned}
$$

**Why it matters.** Proofs in algorithm courses are built from implications, and the two most common errors are proving the converse and negating an implication instead of its contrapositive.

**Worked example.** "If a number is divisible by 6 then it is divisible by 3" is true, and so is its contrapositive "if it is not divisible by 3 then it is not divisible by 6". The converse "if it is divisible by 3 then it is divisible by 6" is false, with $9$ as the counterexample. A solution that argues "the algorithm only ever produces a multiple of 6, therefore the output is divisible by 3" is using the forward direction correctly; a solution that argues "the output is divisible by 3, therefore it is divisible by 6" has swapped the implication.

**What you must get right.** To prove $P \to Q$, assume $P$ and derive $Q$. To disprove $P \to Q$, find one case where $P$ holds and $Q$ does not. Never argue from $Q$ to $P$ unless you have also proved the converse.

### Checkpoint

**Conceptual.**

1. State the truth condition of $P \to Q$, and say when it is false.
2. Explain why the contrapositive is equivalent to the original implication and the converse is not. Give a counterexample for the converse.
3. Give the contrapositives of "if $a$ divides $b$ then $b$ divides $a$" and of "if the algorithm terminates then it prints the right answer", and say which one is the useful direction for a correctness proof.

**Code reading.**

1. This argument is invalid. Identify the exact logical error and rewrite it correctly:

    ```text
    The loop always produces an even number, so the number it produces
    is divisible by 4.
    ```

2. This argument is valid but proves less than the author intended. Explain what was actually proved, and state the additional fact that would be needed:

    ```text
    If the input is sorted then the binary search finds the target.
    Therefore the binary search finds the target.
    ```

**Implementation.** Write a truth-table checker for two propositions with three variables each, and use it to verify that $P \to Q$ and $\neg Q \to \neg P$ have identical truth tables over all eight assignments. Report the number of assignments where they agree.

**Applied problem.** A problem statement says: "if the input contains any duplicate value, the answer is -1; otherwise the answer is the number of distinct values". Write the implication you must prove, and give the smallest input that would violate it.

## 3.3 Quantifiers and negation

Two quantifiers carry almost all of the mathematics in competition problems.

- $\forall x\, P(x)$: for every $x$ in the domain, $P(x)$ holds.
- $\exists x\, P(x)$: there is at least one $x$ in the domain for which $P(x)$ holds.

Their order matters enormously. $\forall x\,\exists y\, P(x, y)$ says that for each $x$ there is a suitable $y$, and the $y$ may depend on $x$. $\exists y\,\forall x\, P(x, y)$ says there is a single $y$ that works for every $x$. The second is strictly stronger, and a proof of the first is not a proof of the second.

Negation reverses the quantifier and the predicate:

$$
\begin{aligned}
\neg\bigl(\forall x\, P(x)\bigr) &\equiv \exists x\, \neg P(x), \\
\neg\bigl(\exists x\, P(x)\bigr) &\equiv \forall x\, \neg P(x).
\end{aligned}
$$

<MathPanel type="definition" title="Negating a quantified statement">
The negation of a universally quantified statement is an existentially
quantified statement, and the negation of an existentially quantified
statement is a universally quantified statement. In both cases the
predicate is negated as well.
</MathPanel>

**Why it matters.** Contest specifications are quantified statements. "Your program must print the correct answer for every valid input" is a universal claim, and a single counterexample refutes it. That asymmetry is the whole basis of the counterexample method in module 6.5, and it is also why a problem saying "find an input for which your program fails" is asking for one example, not a family.

**Worked example.** The specification says: "for every pair of distinct students, there is a shared class." The negation is: "there exist two distinct students with no shared class." To refute the specification you need exactly one pair. To prove the specification you need an argument that works for all pairs.

**What you must get right.** $\forall$ negates to $\exists$, never to "not all". And a single counterexample suffices against a universal claim, while no single example can establish one.

### Checkpoint

**Conceptual.**

1. Negate $\forall x \exists y\, P(x,y)$ and $\exists x \forall y\, P(x,y)$. Which of the two original statements is stronger, and why?
2. Explain why one counterexample refutes a universal claim but no single example can establish one.
3. Give an example of a contest specification that is existentially quantified, and say what a valid solution to it must produce.

**Code reading.**

1. This comment claims the function is correct. Say what it actually establishes, and what it would take to establish the stronger claim:

    ```java
    // Returns a solution for every valid input.
    // (We tested it on the first 100 random cases and it always worked.)
    ```

2. This loop is supposed to find a witness for an existentially quantified claim. Say what it establishes, and what it would take to establish the claim for _all_ inputs:

    ```cpp
    bool found = false;
    for (auto& x : candidates)
        if (satisfies(x)) { found = true; break; }
    ```

**Implementation.** Write a function that enumerates all assignments of two boolean variables and reports which formulas are equivalent to $P \leftrightarrow Q$. Print the equivalences you find and the number of assignments on which each holds.

**Applied problem.** A problem says: "there is always an input of size at most $n$ on which your algorithm is wrong". Explain what this claim quantifies over, and describe how you would go about either proving or refuting it.

## 3.4 Mathematical induction

Induction is the method of proof for statements indexed by the natural numbers.

<MathPanel type="theorem" title="Principle of mathematical induction">
Let $P(n)$ be a statement about the natural numbers. If there is an
integer $n_0$ such that $P(n_0)$ holds, and for every $k \ge n_0$ the
implication $P(k) \Rightarrow P(k+1)$ holds, then $P(n)$ holds for every
$n \ge n_0$.
</MathPanel>

The proof has two parts, and the second part must use the _general_ statement $P(k)$, not a special case. The version where the step assumes $P(j)$ for every $j \le k$ is _strong_ induction, and it is occasionally more convenient.

**Why it matters.** Induction is how you prove that a loop computes what it claims, and how you prove that a recursive function terminates with the right value. It is also the standard technique for validating the closed forms of the summations in module 3.6.

**Worked example.** Let $P(n)$ be the statement $1 + 2 + \dots + n = \frac{n(n+1)}{2}$.

_Base case._ For $n = 1$, the left side is $1$ and the right side is $\frac{1 \cdot 2}{2} = 1$. The statement holds.

_Inductive step._ Assume $P(k)$ holds, so that $1 + 2 + \dots + k = \frac{k(k+1)}{2}$. Then

$$
1 + 2 + \dots + k + (k+1) = \frac{k(k+1)}{2} + (k+1) = \frac{(k+1)(k+2)}{2},
$$

which is exactly $P(k+1)$. By the principle of induction, $P(n)$ holds for every $n \ge 1$. _End of proof._

**What you must get right.** The inductive hypothesis must be used as a general fact. A step that only checks the case $k = 3$ proves nothing about $k = 4$, and the base case must be the _first_ case, not a case you happen to have checked.

### Checkpoint

**Conceptual.**

1. State the principle of mathematical induction, including the role of $n_0$ and the requirement that the step use the general hypothesis.
2. State what strong induction adds, and give a situation in which it is more convenient than ordinary induction.
3. Explain why checking the first hundred cases of a statement does not establish it for all natural numbers, and what it does establish.

**Code reading.**

1. This is the inductive step for a claim about a recursive function. Identify the hypothesis being used, and say what is missing:

    ```text
    Assume the claim holds for k-1. Then it holds for k as well.
    ```

2. This is the base case and step for a claim about a loop. Say whether the base case is stated for the right starting value, and what the invariant is:

    ```text
    Base: for n = 0 the sum is 0, which equals n(n+1)/2.
    Step: assuming the sum after n iterations is n(n+1)/2, after the
    next iteration it is n(n+1)/2 + (n+1), which equals (n+1)(n+2)/2.
    ```

**Implementation.** Write a function `sumTo(n)` that computes $1 + 2 + \dots + n$ twice: once with a loop, once with the closed form. Check that they agree for every $n$ from 0 to $10^6$, and report the largest $n$ for which the closed form still fits in a signed 64-bit integer.

**Applied problem.** Prove by induction that binary search on an interval of length $m$ performs at most $\lceil \log_2 m \rceil + 1$ comparisons. State the base case, the inductive hypothesis, and the inductive step.

## 3.5 Invariants and proof by contradiction

A **loop invariant** is a property that is true immediately before and immediately after every iteration of a loop. Three things are needed to use one:

1. **Initialization.** The invariant holds before the loop is entered.
2. **Maintenance.** If the invariant holds before an iteration, it holds after it.
3. **Termination.** When the loop exits, the invariant plus the exit condition give the postcondition.

<MathPanel type="invariant" title="Loop invariant">
A loop invariant is a statement $I$ about the program state such that
$I$ holds before the loop, $I$ is preserved by each iteration, and $I$
together with the negation of the loop condition implies the desired
postcondition.
</MathPanel>

**Proof by contradiction** (reductio ad absurdum) assumes the negation of what you want and derives something impossible: a contradiction with an assumption, with the laws of arithmetic, or with a previously proved theorem.

**Why it matters.** The invariant is how you convince yourself that a loop is correct without executing it. Contradiction is how you prove that an algorithm cannot fail, which is often cleaner than a direct argument, and it is the standard shape of the correctness proof in a contest write-up.

**Worked example.** Binary search maintains the invariant: _if the target is present in the array, then it is present in the interval $[\text{lo}, \text{hi}]$_. It holds initially, because the interval starts as the whole array. Each iteration either discards the half that cannot contain the target, preserving the invariant, or returns. When the interval becomes empty the invariant says the target is not present, so returning "not found" is correct.

A contradiction proof that binary search terminates: suppose it did not. Then some interval $[\text{lo}, \text{hi}]$ with $\text{lo} \le \text{hi}$ would recur forever. But each iteration replaces the interval with a strictly shorter one, since the midpoint is strictly inside it. An infinite strictly decreasing sequence of non-negative integers is impossible, a contradiction.

**What you must get right.** An invariant that only holds _after_ the first iteration is not an invariant; it must hold before the loop starts. And in a contradiction proof, you must state precisely what you are assuming and derive an explicit impossibility.

### Checkpoint

**Conceptual.**

1. State the three parts of a loop invariant and the role each plays.
2. Explain why an invariant must hold before the loop starts, and give a candidate invariant for a loop that fails only because it is stated too weakly.
3. Describe the structure of a proof by contradiction, and say how it differs from a direct proof in what it assumes.

**Code reading.**

1. This loop is claimed correct. State an invariant that holds throughout, and say what it establishes when the loop ends:

    ```cpp
    int sum = 0;
    for (int i = 0; i < n; i++) sum += a[i];
    ```

2. This comment gives an invariant that is actually false before the loop starts. Say what it should be instead:

    ```text
    // Invariant: sum equals the sum of the elements processed so far.
    ```

**Implementation.** Write a function that sums a prefix of an array and document a loop invariant for it in three sentences: what it says before the loop, what the body preserves, and what it gives when the loop exits. Then write a second function whose invariant is deliberately wrong, and construct an input on which the invariant fails.

**Applied problem.** Prove that binary search terminates by contradiction, as in the module text. Then state the invariant that shows it is correct when it _does_ terminate, and explain why termination alone would not be enough.

## 3.6 Summations and arithmetic and geometric series

The summation notation $\sum_{i=a}^{b} f(i)$ means $f(a) + f(a+1) + \dots + f(b)$. It is the bridge between a formula and a loop, and it is how you count the work a nested loop performs.

<MathPanel type="theorem" title="Arithmetic series">
For every $n \ge 1$,
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}.
$$
</MathPanel>

_Proof._ Add the sum to its reverse. The sum is $1 + 2 + 3 + \dots + n$ and the reverse is $n + (n-1) + \dots + 1$. Adding them term by term pairs $1$ with $n$, $2$ with $n-1$, and so on: each of the $n$ pairs sums to $n+1$, so $2\sum_{i=1}^{n} i = n(n+1)$, which gives the result. _End of proof._

The closed form is worth having because it turns an $\O(n)$ loop into an $\O(1)$ computation. Summing the integers from $1$ to $n$ in a loop costs $n$ additions; using the formula costs one multiplication, one addition, and one division.

**The nested loop correspondence.** This is where the sum earns its keep. A nested loop's cost is a sum over the outer index, and the shape of the inner bound decides what that sum looks like.

```cpp
// Inner bound depends on the outer index: cost is the arithmetic series.
for (int i = 1; i <= n; i++)
    for (int j = 1; j <= i; j++)
        work();                      // n(n+1)/2 executions

// Inner bound is independent: cost is the product.
for (int i = 1; i <= n; i++)
    for (int j = 1; j <= n; j++)
        work();                      // n^2 executions

// Inner bound shrinks: same order as the first, with a different constant.
for (int i = 1; i <= n; i++)
    for (int j = 1; j <= n - i + 1; j++)
        work();                      // n(n+1)/2 executions

// Inner bound halves: cost is a different series entirely.
for (int i = 1; i <= n; i++)
    for (int j = 1; j <= n; j *= 2)
        work();                      // n * (floor(log2 n) + 1) executions
```

The first loop executes $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ times. The second executes $\sum_{i=1}^{n} n = n \cdot n$ times. The third executes $\sum_{i=1}^{n}(n-i+1) = \frac{n(n+1)}{2}$ times. The fourth executes $\sum_{i=1}^{n}(\lfloor \log_2 n \rfloor + 1) = n(\lfloor \log_2 n \rfloor + 1)$ times, which is $\Theta(n \log n)$ rather than $\Theta(n^2)$.

This is the connection to module 2.4: the sum you write down _is_ the count of the loop, and the closed form tells you the complexity and sometimes removes the loop.

**Geometric series.** For $r \ne 1$,

$$
\sum_{i=0}^{n} r^{i} = \frac{r^{n+1} - 1}{r - 1},
$$

and for $r = 1$ the sum is $n+1$. The proof is the same trick: multiply the sum by $r$ and subtract, and the middle terms cancel.

**Other sums worth knowing.** $\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}$ and $\sum_{i=1}^{n} i^3 = \left(\frac{n(n+1)}{2}\right)^2$.

**Why it matters.** Closed forms turn loops into arithmetic, and arithmetic is $O(1)$. A problem asking for the sum of the first $n$ integers, or of the first $n$ squares, or of a geometric series, is testing whether you can see the series.

**Worked example.** A problem asks for $\sum_{i=1}^{n} i^2$ with $n \le 10^9$. The loop is impossible, taking $10^9$ steps, and the formula $\frac{n(n+1)(2n+1)}{6}$ computes the answer in constant time. The intermediate product $n(n+1)(2n+1)$ for $n = 10^9$ is about $2 \times 10^{27}$, which overflows a 64-bit integer, so the computation must be done with care: divide by $2$ or by $3$ first, or use 128-bit arithmetic.

**What you must get right.** Match the closed form to the exact shape of the summand, and check the arithmetic of the formula itself. A closed form that overflows is not a solution.

### Checkpoint

**Conceptual.**

1. Derive $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ by pairing, and say why the same argument does not apply to $\sum_{i=1}^{n} i^2$.
2. State the closed forms of $\sum i^2$, $\sum i^3$, and the geometric series, and give the condition under which the geometric formula holds.
3. Explain why a closed form is usually preferable to a loop even when the loop is fast enough.

**Code reading.**

1. Count the exact number of executions of this loop for a given $n$, and name the series it corresponds to:

    ```cpp
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= i; j++)
            work();
    ```

2. Count the exact number of executions of this loop, and say what changes about the answer when the inner loop's condition is `j < i` instead of `j <= i`:

    ```cpp
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n - i + 1; j++)
            work();
    ```

**Implementation.** Write a program that computes $\sum_{i=1}^{n} i^2$ for $n$ up to $10^9$ using the closed form, and check the result against the loop for $n$ up to $10^5$. Then find the largest $n$ for which the intermediate product $n(n+1)(2n+1)$ fits in a signed 64-bit integer, working around the overflow when it does not.

**Applied problem.** A problem asks for $\sum_{i=0}^{n} 2^i \bmod m$ with $n \le 10^{18}$ and $m = 10^9 + 7$. Give the closed form, explain why computing it directly is impossible, and describe an algorithm that works in $O(\log n)$ time.

## 3.7 Permutations and combinations

Counting ordered and unordered selections is the most common counting task in competition problems, and the four cases are best learned as a table rather than derived.

|                       | Repetition not allowed       | Repetition allowed |
| --------------------- | ---------------------------- | ------------------ |
| Order matters         | $P(n,k) = \frac{n!}{(n-k)!}$ | $n^k$              |
| Order does not matter | $\binom{n}{k}$               | $\binom{n+k-1}{k}$ |

The reasoning is straightforward. For $P(n,k)$ you choose $n$ ways for the first position, $n-1$ for the second, and so on, giving $n(n-1)\dots(n-k+1)$. For $n^k$, each of the $k$ positions independently has $n$ choices. For $\binom{n}{k}$, you divide $P(n,k)$ by $k!$, because each unordered selection of $k$ distinct items corresponds to exactly $k!$ orderings.

**Worked example.** How many distinct arrangements are there of the letters in BANANA? There are six letters, of which three are A, two are N, and one is B. Dividing by the factorials of the repeated counts gives $\frac{6!}{3!\,2!\,1!} = \frac{720}{12} = 60$.

**Why it matters.** Whenever a problem asks "in how many ways", the first question is always the same pair: does order matter, and can an item be reused? Getting that wrong makes every subsequent computation wrong.

**What you must get right.** Decide order and repetition before you count, and when repetitions exist in the input, divide by the factorial of each repetition count, not by the factorial of the number of repeated items.

### Checkpoint

**Conceptual.**

1. State the four cases of the counting table and the question that decides which case applies.
2. Derive the formula for unordered selection with repetition, and give the stars-and-bars picture that justifies it.
3. Explain why, when the input contains repeated items, you divide by the factorial of each repetition count rather than by the factorial of the number of repeated items.

**Code reading.**

1. This function counts arrangements of a word. Say what it computes for the word "BANANA", and what the correct answer is:

    ```java
    long count(int n, int a, int b) { return factorial(n) / factorial(a) / factorial(b); }
    ```

2. This code selects a committee. Say what it counts, and give the correct formula for choosing $k$ people from $n$ where order does not matter and no one may serve twice:

    ```java
    long ways = 1;
    for (int i = 0; i < k; i++) ways *= (n - i);
    ```

**Implementation.** Write a function that counts the distinct arrangements of a word given its letter frequencies, and verify it on "BANANA", "LEVEL" and "AAB". Then write a function that counts the arrangements of $n$ distinct items in which a specified subset of $k$ items must stay together as a block.

**Applied problem.** A problem asks how many distinct 8-character passwords can be made from the letters of "PASSWORD" if the password must not start with a vowel. Give the answer and explain each factor in it.

## 3.8 Factorials and binomial coefficients

The factorial $n! = n \cdot (n-1) \cdots 1$ counts the orderings of $n$ distinct objects. The convention $0! = 1$ makes the recurrence $n! = n \cdot (n-1)!$ hold at $n = 0$, and it corresponds to the single ordering of the empty set.

The **binomial coefficient** $\binom{n}{k}$ counts the $k$-element subsets of an $n$-element set. It satisfies the recurrences that make it computable by dynamic programming.

<MathPanel type="theorem" title="Pascal's identity">
For $1 \le k \le n$,
$$
\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k},
$$
with $\binom{n}{0} = \binom{n}{n} = 1$.
</MathPanel>

_Proof._ Partition the $k$-element subsets of an $n$-element set by whether they contain a fixed element $x$. Those that do are in bijection with the $(k-1)$-element subsets of the remaining $n-1$ elements, giving $\binom{n-1}{k-1}$. Those that do not are in bijection with the $k$-element subsets of the remaining $n-1$ elements, giving $\binom{n-1}{k}$. The two classes are disjoint and exhaustive, so their sizes add. _End of proof._

Pascal's identity is the reason binomial coefficients are so natural in dynamic programming: the recurrence is exactly a table-filling rule.

**Computing them.** Two approaches:

- **By table.** Fill a Pascal triangle using the recurrence, in $O(nk)$ time and $O(k)$ space if you keep one row.
- **Multiplicatively.** $\binom{n}{k} = \binom{n}{k-1} \cdot \frac{n - k
    - 1}{k}$, computed in $O(k)$ steps. The division must be exact at every step, which is why the multiplication happens before the division.

**Overflow.** The largest binomial coefficient in row $n$ is $\binom{n}{\lfloor n/2 \rfloor}$. For $n = 66$ it is $7219428434016265740$, which fits in a signed 64-bit integer. For $n = 67$ it is about $1.42 \times 10^{19}$, which does not. So a signed 64-bit integer holds every binomial coefficient up to $n = 66$ and no further.

**Modular arithmetic changes everything.** When the answer is required modulo a prime $p$, you never form the binomial coefficient: you compute it modulo $p$ throughout, and you replace division by a modular inverse. The details are in module 3.9.

**Why it matters.** Binomial coefficients count subsets, which is what you are counting when you choose a team, a subset of positions, a set of test cases, or the terms of a polynomial expansion.

**Worked example.** The number of ways to choose $k$ elements from $n$ distinct elements, computed multiplicatively and exactly:

```python
def binom(n, k):
    k = min(k, n - k)          # symmetry: C(n,k) == C(n,n-k)
    result = 1
    for i in range(k):
        result = result * (n - i) // (i + 1)
    return result
```

The `//` is exact at every step because $\binom{n}{i+1}$ is always an integer. Writing `result * (n - i) / (i + 1)` in a language with floating-point division would be both slower and wrong for large values.

**What you must get right.** Divide after multiplying, use symmetry to halve the work, and use modular inverses rather than division when the answer is required modulo a number.

### Checkpoint

**Conceptual.**

1. State Pascal's identity and explain the bijection that proves it.
2. State the multiplicative formula for binomial coefficients and say why the division must be exact at every step.
3. Give the largest $n$ for which $\binom{n}{\lfloor n/2 \rfloor}$ fits in a signed 64-bit integer, and explain why the answer is not simply $n = 66$ for every row.

**Code reading.**

1. This function computes a binomial coefficient. Say what goes wrong for large inputs, and give the corrected version:

    ```python
    def binom(n, k):
        return factorial(n) // (factorial(k) * factorial(n - k))
    ```

2. This function computes the same thing multiplicatively. Say why it gives the wrong answer for $n = 5, k = 2$, and rewrite it:

    ```python
    def binom(n, k):
        r = 1.0
        for i in range(k):
            r = r * (n - i) / (i + 1)
        return r
    ```

**Implementation.** Write a function that computes $\binom{n}{k}$ exactly for $n \le 66$ using the multiplicative formula, and check it against a Pascal-triangle table for all $n \le 30$ and all $k$. Then write the version that returns the value modulo a prime, and check that it agrees with the exact version whenever the exact value is below the modulus.

**Applied problem.** A problem asks for $\binom{10^6}{500000} \bmod (10^9+7)$. Explain why the exact value cannot be computed, describe the modular approach in one paragraph, and state its time complexity.

## 3.9 Modular arithmetic

Modular arithmetic is arithmetic in the _residues_ of a division. We write $a \equiv b \pmod m$ when $m$ divides $a - b$. The residue classes modulo $m$ form a ring, and the addition and multiplication tables of that ring behave like the ordinary ones.

<MathPanel type="definition" title="Modular inverse">
Let $m > 1$ and suppose $\gcd(a, m) = 1$. Then there is an integer $b$
such that $ab \equiv 1 \pmod m$, called the multiplicative inverse of
$a$ modulo $m$. It exists exactly when $a$ and $m$ are coprime.
</MathPanel>

Because the modulus lets you reduce after every operation, intermediate values stay small: with a modulus of $10^9 + 7$, every value you ever hold is below $10^9 + 7$, which fits comfortably in a 64-bit integer.

**Fermat's little theorem.** If $p$ is prime and $a$ is not divisible by $p$, then $a^{p-1} \equiv 1 \pmod p$. Consequently, when $p$ is prime, $a^{-1} \equiv a^{p-2} \pmod p$, and division modulo $p$ becomes multiplication by $a^{p-2}$.

**Euler's theorem.** For any modulus $m$ with $\gcd(a, m) = 1$, $a^{\varphi(m)} \equiv 1 \pmod m$, where $\varphi$ is Euler's totient function.

**Binary exponentiation.** To compute $a^e \bmod m$, use the repeated squaring method: write $e$ in binary and multiply the appropriate powers. This takes $O(\log e)$ modular multiplications rather than $O(e)$.

**Why it matters.** Modular arithmetic is how every large-arithmetic contest problem is solved. "Compute the answer modulo $10^9 + 7$" is a statement about the computation, not just about the output format.

**Worked example.** Computing $a^e \bmod m$ by repeated squaring:

```cpp
long long mod_pow(long long a, long long e, long long m) {
    long long result = 1 % m;
    a %= m;
    while (e > 0) {
        if (e & 1) result = result * a % m;
        a = a * a % m;
        e >>= 1;
    }
    return result;
}
```

The loop runs $\lfloor \log_2 e \rfloor + 1$ times. With $e = 10^{18}$ that is about 60 iterations, against about $10^{18}$ for the naive repeated multiplication.

**What you must get right.** You cannot divide modulo $m$. You multiply by the modular inverse, and the inverse exists only when the divisor is coprime to the modulus. Also, the multiplication `result * a` inside the loop can overflow a 64-bit integer if the modulus is close to $10^9$ and both factors are close to the modulus, so use 128-bit intermediate arithmetic or a smaller modulus.

### Checkpoint

**Conceptual.**

1. State Fermat's little theorem and the condition it requires.
2. Explain how division modulo a prime is performed, and say what goes wrong when the divisor shares a factor with the modulus.
3. Explain why reducing modulo $m$ after every multiplication keeps intermediate values small, and give the largest intermediate value that can appear when $m = 10^9 + 7$.

**Code reading.**

1. This function computes a modular power. Say how many modular multiplications it performs for a 60-bit exponent, and why the intermediate `result * a` does not overflow a 64-bit integer in this case:

    ```cpp
    long long mod_pow(long long a, long long e, long long m) {
        long long r = 1 % m; a %= m;
        while (e > 0) {
            if (e & 1) r = r * a % m;
            a = a * a % m; e >>= 1;
        }
        return r;
    }
    ```

2. This function tries to divide modulo $m$. Say what it computes when $b$ is not coprime to $m$, and give an input where it is wrong:

    ```cpp
    long long divmod(long long a, long long b, long long m) {
        return a * mod_pow(b, m - 2, m) % m;
    }
    ```

**Implementation.** Write an iterative modular inverse using the extended Euclidean algorithm, and check it for every pair $(a, m)$ with $1 \le a < m \le 200$ and $\gcd(a, m) = 1$, verifying that $a \cdot a^{-1} \equiv 1 \pmod m$.

**Applied problem.** A problem asks for $\frac{1}{k} \bmod (10^9 + 7)$ for a given $k$, with $k < 10^9 + 7$. Explain why the answer exists for every such $k$, give the formula, and state the number of modular multiplications it requires.

## 3.10 Greatest common divisor, least common multiple and primes

An integer $a$ **divides** $b$, written $a \mid b$, when there is an integer $k$ with $b = ak$. The **greatest common divisor** $\gcd(a,b)$ is the largest positive integer dividing both. The **least common multiple** satisfies

$$
\operatorname{lcm}(a,b) = \frac{ab}{\gcd(a,b)}.
$$

The Euclidean algorithm computes the gcd by repeatedly replacing the larger argument with the remainder.

<MathPanel type="lemma" title="Euclid's step">
For integers $a \ge b > 0$,
$$
\gcd(a, b) = \gcd(b, a \bmod b).
$$
</MathPanel>

_Proof._ Write $a = qb + r$ with $0 \le r < b$. Any common divisor of $a$ and $b$ divides $a - qb = r$, and any common divisor of $b$ and $r$ divides $qb + r = a$. So the two pairs have exactly the same common divisors, and in particular the same greatest common divisor. _End of proof._

Each step reduces the larger argument to less than half of itself, so the algorithm runs in $O(\log \min(a,b))$ steps.

**Primes.** A prime is a positive integer greater than $1$ with exactly two positive divisors. Every integer greater than $1$ factors uniquely into primes, and the number of distinct prime factors of $n$ is $\Omega(\log_2 n)$ at most.

The **sieve of Eratosthenes** marks the multiples of every prime up to $n$, giving $O(n \log \log n)$ time and $O(n)$ space, and it produces every prime up to $n$ at once. Trial division by primes up to $\sqrt n$ is $O(\sqrt n)$ per primality test.

<MathPanel type="theorem" title="Smallest prime factor">
If $n$ is composite then $n$ has a prime factor at most $\sqrt n$.
</MathPanel>

_Proof._ Suppose every prime factor of $n$ exceeded $\sqrt n$. Then $n$ would be a product of at least two primes, each exceeding $\sqrt n$, so $n > (\sqrt n)^2 = n$, a contradiction. _End of proof._

**Why it matters.** The gcd is the basis of the Euclidean algorithm for finding the modular inverse, which is the basis of every modular division problem. Primality underlies sieve-based precomputation, the Chinese remainder theorem, and the prime factorisation of integers.

**Worked example.** The sieve:

```cpp
std::vector<bool> is_prime(n + 1, true);
is_prime[0] = is_prime[1] = false;
for (int p = 2; 1LL * p * p <= n; ++p) {
    if (!is_prime[p]) continue;
    for (long long multiple = 1LL * p * p; multiple <= n; multiple += p)
        is_prime[multiple] = false;
}
```

The inner loop starts at $p^2$ rather than $p$ because the smaller multiples of $p$ have already been marked by smaller primes. The total number of marking operations is $\sum_{p \le \sqrt n} n/p = O(n \log \log n)$.

**What you must get right.** Compute the lcm as $\frac{a}{\gcd(a,b)} \cdot b$, not as $\frac{ab}{\gcd(a,b)}$. The first form divides before it multiplies and cannot overflow when the answer fits; the second computes a product that can be up to $\gcd(a,b)$ times too large.

### Checkpoint

**Conceptual.**

1. State the Euclidean step and prove that it preserves the gcd.
2. Give the lcm formula and say why the division must come before the multiplication.
3. State the theorem that a composite number has a prime factor at most $\sqrt n$, and explain how it makes trial division fast.

**Code reading.**

1. This function computes the lcm. Say what is wrong with it for large inputs, and rewrite it:

    ```cpp
    long long lcm(long long a, long long b) { return a * b / gcd(a, b); }
    ```

2. This loop tests primality. Say how many values it tests, and what the bound is on the number of divisions for a composite input:

    ```cpp
    bool isPrime(int n) {
        for (int d = 2; 1LL * d * d <= n; d++)
            if (n % d == 0) return false;
        return n > 1;
    }
    ```

**Implementation.** Write a sieve of Eratosthenes for $n \le 10^7$, count the number of marking operations it performs, and check that the count is close to $n \log \log n$. Then write a function that reports the $k$-th prime and check it against the sieve.

**Applied problem.** A problem gives $n \le 10^9$ and asks for the number of integers in $[1, n]$ that are coprime to $n$. State the answer in terms of the prime factorisation of $n$, describe how to obtain that factorisation for $n \le 10^9$, and give the complexity of each step.

## 3.11 Basic probability and expected value

A **sample space** is the set of all possible outcomes of an experiment, and an **event** is a subset of it. The probability of an event is its size divided by the size of the sample space, when the space is finite and the outcomes are equally likely.

<MathPanel type="definition" title="Expected value">
For a random variable $X$ taking values in a finite set, the expected
value is
$$
\mathbb{E}[X] = \sum_x x \cdot \Pr[X = x].
$$
</MathPanel>

The expected value is a weighted average, so it lies between the smallest and largest possible values of $X$. It is _not_ the most likely value, and it need not be an achievable value at all: the expected number of heads in one fair coin flip is $\frac{1}{2}$.

**Linearity of expectation** is the workhorse.

<MathPanel type="lemma" title="Linearity of expectation">
For random variables $X_1, \dots, X_k$ and coefficients
$a_1, \dots, a_k$,
$$
\mathbb{E}\left[\sum_{i=1}^{k} a_i X_i\right] = \sum_{i=1}^{k} a_i\, \mathbb{E}[X_i].
$$
No independence assumption is needed.
</MathPanel>

_Proof._ By the definition of expectation, $\mathbb{E}[Y] = \sum_y y \Pr[Y = y]$; expand $Y = \sum_i a_i X_i$ by the definition of a sum of random variables and group the terms by $i$. Each group contributes $a_i \mathbb{E}[X_i]$. Independence would be needed to factor $\Pr[X = x, X' = x']$, and the proof never does. _End of proof._

**Why it matters.** Expected value turns a probabilistic argument into an exact computation, and it is the standard tool for proving that an algorithm is fast _on average_ even when the worst case is bad. Quicksort's expected cost of $2(n-1) \ln n$ comparisons comes from linearity of expectation applied to the contribution of each element.

**Worked example.** In quicksort with a uniformly random pivot, the expected number of comparisons is $2(n-1) H_n$, where $H_n = 1 + \frac{1}{2} + \dots + \frac{1}{n}$ is the $n$-th harmonic number, and $H_n \approx \ln n + \gamma$. The derivation sums, over each pair of elements, the probability that the two are compared, which is $\frac{2}{j-i+1}$ for a pair at distance $j - i$.

**What you must get right.** Linearity of expectation needs no independence, but the rule $\mathbb{E}[XY] = \mathbb{E}[X]\mathbb{E}[Y]$ does. If a problem's solution multiplies two expectations, it must justify independence, and in most contest settings it cannot.

### Checkpoint

**Conceptual.**

1. State the definition of expected value and explain why it need not be an achievable value.
2. State linearity of expectation and the assumption it does _not_ require.
3. State the rule for multiplying two expectations and the condition under which it is valid.

**Code reading.**

1. This code computes an expected value by simulation. Say what it estimates and what its accuracy depends on:

    ```python
    total = 0
    for _ in range(100000):
        a, b = random.randrange(6) + 1, random.randrange(6) + 1
        total += max(a, b)
    print(total / 100000)
    ```

2. This solution multiplies two expectations. Say under what condition it would be correct, and why that condition usually does not hold:

    ```text
    Each of the n cows independently lands in one of k stalls, so the
    expected number of cows in a stall is n/k, and the expected number of
    stalls containing exactly one cow is k * (n/k) * (1 - 1/k)^(n-1).
    ```

**Implementation.** Compute the expected value of the sum of two fair six-sided dice by enumerating all 36 outcomes, and check that the result matches the analytic value of $7$. Then compute the expected number of distinct values seen in $m$ draws from $n$ possible values, by enumeration for small $n$ and by the formula $n(1 - (1 - 1/n)^m)$ for larger $n$, and compare them.

**Applied problem.** A randomised algorithm picks a uniformly random element from an array of $n$ elements and then scans the array for it. Give the expected number of comparisons, explain how the answer changes if the picked element is the last one, and say whether the algorithm is worth using.

## 3.12 Counting arguments and the pigeonhole principle

**The pigeonhole principle** is the most frequently used theorem in competition mathematics, and it is worth stating precisely.

<MathPanel type="theorem" title="Pigeonhole principle">
If $n + 1$ objects are placed into $n$ boxes, then at least one box
contains at least two objects. More generally, if $n$ objects are placed
into $k$ boxes, some box contains at least $\lceil n/k \rceil$ objects.
</MathPanel>

_Proof._ Suppose every box contained at most one object. Then the boxes would hold at most $n$ objects in total, contradicting the placement of $n+1$. For the general form, suppose every box held at most $\lceil n/k \rceil - 1$ objects; then the total capacity would be $k(\lceil n/k \rceil - 1) < n$, a contradiction. _End of proof._

Counting arguments come in a few forms:

- **Direct counting.** Count the desired objects by a formula.
- **Complementary counting.** Count the objects you do not want and subtract from the total.
- **Inclusion-exclusion.** $|A \cup B| = |A| + |B| - |A \cap B|$, and for three sets you subtract the pairwise intersections and add back the triple intersection.
- **Bijection.** Construct an explicit one-to-one correspondence between the two sets you want to equate.

**Why it matters.** The pigeonhole principle is how problems that say "there exist two" are solved, and it is the engine behind "assume for contradiction that all values are distinct, but there are only $k$ possible values and $n > k$ objects".

**Worked example.** Among any $n+1$ integers, two have the same remainder modulo $n$: the $n+1$ integers go into the $n$ residue classes. Among any $n+1$ integers chosen from $\{1, 2, \dots, 2n\}$, two differ by exactly $n$: sort them and consider the $n+1$ successive differences; if none equals $n$, all are at most $n-1$, but the total span is at least $2n$, giving a contradiction.

**What you must get right.** Name the objects and the boxes explicitly, and count them. A pigeonhole argument that does not say what is being placed where cannot be checked, and the classic failure is using $n$ objects and $n$ boxes, where no collision is guaranteed.

## Review checklist

You are ready for part 4 when you can answer the following without consulting the text.

- Distinguish injective from surjective, and give an example of a function that is one but not the other.
- Explain why the contrapositive of an implication is equivalent to it and why the converse is not, with a counterexample.
- Negate $\forall x \exists y\, P(x,y)$ and $\exists x \forall y\, P(x,y)$, and say which is stronger.
- State the principle of mathematical induction and use it to prove the arithmetic series formula.
- State the three parts of a loop invariant, and write the invariant that binary search maintains.
- Derive $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ and use it to count the executions of a nested loop whose inner bound is the outer index.
- Explain why $\binom{67}{33}$ does not fit in a signed 64-bit integer while $\binom{66}{33}$ does.
- Compute a modular inverse, and state the condition under which it exists.
- Apply the pigeonhole principle to show that any $n+1$ integers contain two whose difference is divisible by $n$.
- Use linearity of expectation to bound the expected cost of a randomised algorithm, and say which algebraic rule you may not use.

Next: [Data structures and modeling](/start/from-ap-csa/part-4-data-structures-and-modeling).
