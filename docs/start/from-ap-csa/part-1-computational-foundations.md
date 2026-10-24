---
id: start.computational-foundations
title: Computational foundations
summary: How a program becomes a process, what lives where in memory, and why the same algorithm behaves differently in different languages.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [memory, recursion, stack, overflow, compilation, determinism]
prerequisites:
    required: []
    recommended: [start.from-ap-csa, languages.c, languages.cpp17, languages.java]
reviewed: false
draft: false
---

Part 1 is about the machine underneath the language. Almost every contest failure that is not a wrong idea has a root here: an input read that assumed line structure, an integer that wrapped, a recursion that ran out of stack, or a program whose output depended on something the judge does not control.

The ten modules below are ordered. Module 1.1 explains what happens when you press run, 1.2 to 1.4 explain where your data lives, 1.5 and 1.6 explain how numbers are represented, 1.7 explains how functions receive data, 1.8 explains the input and output contract, and the last three modules explain what happens when something goes wrong.

<Synonyms terms="systems basics, machine model, memory model, computer science prerequisites" />

## 1.1 Compilation and interpretation

A compiler translates a whole program before any of it runs. An interpreter executes the program as it reads it, statement by statement. The distinction is about _when_ translation happens, not about how fast the result is.

In practice the boundary is blurry. CPython compiles source to bytecode and executes that bytecode in a virtual machine. The Java compiler produces bytecode, and the just-in-time compiler in the runtime turns hot methods into native code. Modern JavaScript engines do the same thing. Only C and C++ are genuinely ahead-of-time all the way down to machine code, and only interpreted shell-like languages stay interpreted.

Why this matters in a contest:

- A syntax error is found before execution begins, so it never consumes any of your time limit and never depends on which test case triggers it.
- A semantic error is found at run time, and _which_ test case finds it depends on the data, so the first failing test tells you very little.
- The time limit is wall-clock time on the judge's machine, and the same algorithm costs different amounts in different languages. Python interpreted loops run roughly fifty to a hundred times slower than equivalent C++ loops. That gap is large enough that an $O(n^2)$ Python solution can time out where the C++ version passes easily.
- Undefined behavior gives the compiler permission to assume your program never does it. If you trigger it, the compiler may remove the very check you relied on, and the program may then behave differently on the judge's machine than on yours.

::: math definition Undefined behavior
Undefined behavior is a situation in which the language standard places no requirement on the program. The compiler may assume the situation does not occur, and may transform the program in ways that are valid for programs where it does not occur. Signed integer overflow, dereferencing a null or out-of-range pointer, and reading an uninitialized variable are all undefined behavior in C and C++.
:::

**Worked example.** The following C++ program prints a different answer depending on the compiler, because signed overflow is undefined:

```cpp
int main() {
    int a = 2000000000;
    int b = a + a;        // 4e9 does not fit in a signed 32-bit int
    std::cout << b << '\n';
}
```

On one build this prints `-294967296`, the two's-complement wraparound. On another build the compiler may deduce that `a + a` overflows, assume it cannot happen, and optimize the addition away entirely. Both behaviors conform to the standard, which is exactly the problem.

**What you must get right.** Compilation is a _when_, not a _how fast_. When a program is slow in a contest, the cause is almost always the number of operations the algorithm performs and the cost of each operation, not the presence or absence of a compiler. When a program is _wrong_ in a way that only shows up sometimes, suspect undefined behavior before you suspect your logic.

### Checkpoint

**Conceptual.**

1. A compiler translates a program before it runs; an interpreter translates it while it runs. Explain why that distinction does not by itself determine how fast either program executes.
2. State what undefined behavior is, and why a program that triggers it can behave differently on two machines that run the same source file.
3. CPython compiles to bytecode and Java compiles to bytecode. Why is it still wrong to call either language "interpreted" when reasoning about contest performance?

**Code reading.**

1. This C++ fragment prints an expression whose value is not fixed by the standard. Say what the standard permits, and what a compiler is allowed to assume about `a + a`:

    ```cpp
    int a = 2000000000;
    std::cout << (a + a) << '\n';
    ```

2. This Java program prints `1`. Explain which line produces that output and why the analogous C++ program would print `0`:

    ```java
    int[] a = {1, 2, 3};
    int[] b = a;
    b[0] = 99;
    System.out.println(a[0]);
    ```

**Implementation.** Write a program that reads integers until end of input and prints the largest. It must work whether the integers appear on one line, on many lines, or on none, and it must use a token-based reader rather than a line-based one.

**Applied problem.** You are told that a solution "gives wrong answers only on the largest test case". Name three distinct root causes from this part that would produce exactly that symptom, and say which one you would investigate first and why.

## 1.2 Variables, value types, references and memory

A variable is a name bound to a location in memory. What the name refers to depends on the language. In Java and C# the distinction is explicit: primitive types such as `int` and `double` are _value types_, and the variable holds the bits. Class types are _reference types_, and the variable holds an address.

The consequences are worth spelling out, because they are the source of half the aliasing bugs beginners write.

**Value semantics.** Assigning a value type copies the value. After `int b = a;`, the two names refer to independent storage. Changing `b` does not change `a`.

**Reference semantics.** Assigning a reference type copies the _reference_. Two names now point at the same object, and mutating the object through one name is visible through the other.

```java
ArrayList<Integer> a = new ArrayList<>();
ArrayList<Integer> b = a;      // b refers to the same list
b.add(7);
System.out.println(a.size());  // 1, not 0
```

**Value equality versus identity.** Two objects may be equal in value without being the same object. In Java, `a.equals(b)` compares contents when the class defines it, `a == b` compares references, and for the boxed types `Integer` and `String` the reference comparison is a classic source of bugs that happen to work for small values because of the integer cache.

**Why it matters.** In competitive programming you constantly hand data between functions, and you constantly need to know whether a callee can change what the caller sees. The answer differs per language and per parameter kind, so it has to be a deliberate decision rather than a guess.

**Worked example.** Suppose you want a function that removes duplicates from a list. In Java, if you write `static void dedupe(ArrayList<Integer> xs) { xs = new ArrayList<>(new HashSet<>(xs)); }` the caller's list is unchanged: you rebound your local name to a new object. If instead you write `static void dedupe(ArrayList<Integer> xs) { xs.clear(); xs.addAll(new HashSet<>(xs)); }` — which clears before copying, so it is wrong — the caller's list is emptied. The first version mutates the object the caller pointed at only in the sense of not mutating it at all; the second mutates it destructively.

**What you must get right.** A variable that holds an address is not the address. Two names for one object do not give you two objects. Before writing a function that "changes" its argument, decide whether you are mutating the object or rebinding a name, because only the first is visible to the caller in Java.

### Checkpoint

**Conceptual.**

1. State the difference between a value type and a reference type, and explain why assignment behaves differently in the two cases.
2. Why can two objects be equal in value and still be different objects? Which Java operator compares the second thing, and why is it dangerous?
3. Explain why a local variable in a function is described as living in the frame rather than in the heap, and what happens to it when the function returns.

**Code reading.**

1. This Java method is called as `dedupe(xs)` and afterwards `xs` still contains three elements. Explain why the change did not reach the caller:

    ```java
    static void dedupe(ArrayList<Integer> xs) {
        xs = new ArrayList<>(new HashSet<>(xs));
    }
    ```

2. This C++ function silently loses the caller's vector, and the loss is invisible in the output. Say exactly which line performs the loss and why the vector does not survive:

    ```cpp
    void addOne(std::vector<int> v) { v.push_back(1); }
    ```

**Implementation.** Write a Java method `static int[] distinct(int[] a)` that returns a new array containing the distinct values of `a` in first appearance order. Then explain, in one sentence each, why changing the signature to `static void distinct(int[] a)` cannot express the same contract.

**Applied problem.** A problem gives you $n$ integers and asks for the number of distinct values. Describe two ways to do it with a hash-based structure, and say which one you would use if the values are guaranteed to lie in $[0, 10^6]$ and which if they are arbitrary 64-bit integers.

## 1.3 Arrays, dynamic arrays and linked structures

Three storage shapes cover almost every contest need, and they differ in two dimensions: how fast you can reach the $i$-th element, and how fast you can insert near the front.

**Fixed-size arrays** store $n$ elements contiguously. Access is $O(1)$: the address of element $i$ is the base address plus $i$ times the element size. Inserting or deleting in the middle costs $O(n)$, because every later element must move. Contiguity also makes them cache-friendly, which in practice makes them faster than any linked structure despite comparable asymptotics.

**Dynamic arrays** (`ArrayList` in Java, `std::vector` in C++, `list` in Python) are fixed arrays that grow. Appending is amortised $O(1)$: occasionally the array doubles in size and every element is copied, but the copies are rare enough that the average cost stays constant. Inserting at position zero is $O(n)$, because everything shifts.

**Linked structures** store each element in its own node with a link to the next. Inserting or deleting a node whose predecessor you already hold is $O(1)$. Reaching the $i$-th element by index is $O(n)$, because you must walk the links. Every node is a separate allocation, so the memory is scattered and the cache behaves badly.

| Structure | Indexed access | Insert at front | Append | Memory locality |
| --- | --- | --- | --- | --- |
| Fixed array | $O(1)$ | $O(n)$ | $O(1)$ if capacity exists | Excellent |
| Dynamic array | $O(1)$ | $O(n)$ | amortised $O(1)$ | Excellent |
| Singly linked list | $O(n)$ | $O(1)$ given the head | $O(1)$ given the tail | Poor |

**Why it matters.** Contest problems rarely ask you to implement a linked list. They ask you to choose, and the choice is usually forced by the constraint. If the problem needs random access by index, a list is hopeless. If the problem needs to insert and delete from the middle frequently, an array may be hopeless.

**Worked example.** You are implementing a queue that supports enqueue at the back and dequeue at the front, and you also need to iterate over the elements in order. A `deque` in C++ or `ArrayDeque` in Java gives both in $O(1)$. If you instead use a Java `ArrayList` and call `remove(0)`, each dequeue shifts the remaining elements, so a run of $n$ dequeues costs $\Theta(n^2)$ on a list of $n$ elements. The same operations on an `ArrayDeque` cost $O(1)$ each because it keeps its elements in a ring buffer.

**What you must get right.** A linked list has $O(n)$ indexed access. An array has $O(1)$. If a problem needs random access, take the array. If a problem needs heavy front insertion, take the deque or the linked list, and accept the cost of indexed access.

### Checkpoint

**Conceptual.**

1. Give the cost of indexed access, front insertion and append for a fixed array, a dynamic array, and a singly linked list. Which of the nine answers is the one beginners most often get wrong?
2. Why is appending to a dynamic array called _amortised_ $O(1)$ rather than $O(1)$? What is the worst cost of a single append, and under what circumstance does it occur?
3. Explain why a linked list is often slower in practice than an array even when the two have the same asymptotic cost, and name the hardware property responsible.

**Code reading.**

1. This Java loop runs $n$ iterations and takes $\Theta(n^2)$ time on a list of $n$ elements. Identify the operation responsible and give the replacement:

    ```java
    for (int i = 0; i < n; i++) {
        queue.remove(0);
    }
    ```

2. This C++ code appends to a vector inside a loop over $n$ iterations and costs $\Theta(n^2)$ rather than $\Theta(n)$. Explain where the quadratic factor comes from.

**Implementation.** Implement a queue in Java using an `ArrayDeque`, and then re-implement the same queue with a singly linked list. Report the cost of enqueue, dequeue, and indexed access for each, and say which one you would use for a problem that asks for the $k$-th oldest element.

**Applied problem.** A problem asks you to process $10^6$ operations, each of which is "push an element" or "pop the front element". Give the data structure you would choose, the total time complexity of your solution, and the reason a Java `ArrayList` is the wrong choice here.

## 1.4 The call stack, the heap and the recursion stack

When a function is called, the runtime creates an **activation record** on the call stack holding the parameters, the local variables, the return address, and the saved frame pointer. The stack is last-in, first-out: the most recent call is the only one that can return. When the function returns, its record is popped and that memory is reclaimed automatically.

The **heap** is where dynamically allocated objects live. Its lifetime is independent of any activation record: an object allocated in a function outlives the function unless the program explicitly destroys it or the garbage collector reclaims it. In C and C++ you manage that lifetime by hand; in Java, Python, and JavaScript a garbage collector does it for you, at the cost of memory the collector cannot release until it decides to.

The **recursion stack** is simply the call stack being used by recursive functions. Its depth is the current recursion depth, and it is bounded by the memory the operating system or runtime gives the thread.

| Runtime    | Typical default stack                         | Recursion depth before failure  |
| ---------- | --------------------------------------------- | ------------------------------- |
| C and C++  | 8 MB on Linux                                 | roughly $10^5$ to $10^6$ frames |
| Java       | 512 KB to 1 MB per thread                     | roughly $10^3$ to $10^4$ frames |
| CPython    | OS stack, plus a recursion limit              | 1000 frames by default          |
| JavaScript | engine-dependent, often about 10 KB per frame | roughly $10^4$ frames           |

The JavaScript row is the one most often quoted in interviews and the one most often wrong in detail: the precise limit depends on the engine and on how much stack each frame uses, so treat the number as an order of magnitude.

**Why it matters.** Depth-first search on a graph with $10^5$ vertices written recursively will overflow the stack in Java and in CPython, even though the algorithm is correct and linear.

**Worked example.** A recursive call `solve(i)` that calls `solve(i + 1)` has depth $n$ at the deepest point. If each frame is 64 bytes and the stack is 1 MB, the maximum depth is about $16{,}000$ frames. In Java the same recursion throws `StackOverflowError`, which is an `Error` and therefore not caught by `catch (Exception e)`. In CPython the default recursion limit of 1000 is hit first, and `sys.setrecursionlimit(10**6)` raises that limit but does not make deep recursion safe: each Python-level call still consumes a C stack frame, and setting the limit high enough to exhaust the operating system's stack turns a clean `RecursionError` into a crash of the whole interpreter.

**What you must get right.** Recursion depth is a real constraint, and it is a constraint on the shape of the data, not on your cleverness. Know the depth of the inputs you will face, and convert deep recursion into an explicit stack held on the heap when the depth is not bounded by a small constant.

### Checkpoint

**Conceptual.**

1. What does the runtime store in an activation record, and why must activation records be released in last-in, first-out order?
2. Why does an object allocated inside a function outlive that function in Java, while a local array of primitives does not?
3. Explain what `sys.setrecursionlimit` changes and what it does not change. Why does raising the limit in CPython risk turning a clean exception into a crash?

**Code reading.**

1. This Java program throws `StackOverflowError` on a long chain. Say which exception hierarchy it sits in, and why `catch (Exception e)` does not catch it:

    ```java
    void recurse(int n) { recurse(n + 1); }
    ```

2. This C++ function allocates a single integer on the heap and returns it. Say what happens to the integer if the caller forgets to delete it, and what happens if the caller deletes it twice:

    ```cpp
    int* make() { int* p = new int(5); return p; }
    ```

**Implementation.** Write a recursive function in Python that sums a list, then re-write it iteratively with an explicit stack held in a list. State the extra space each version uses, and say which version you would submit for a list of length $2 \times 10^5$.

**Applied problem.** A graph problem has $2 \times 10^5$ vertices and asks for a depth-first traversal. Explain why the textbook recursive depth-first search would fail on a path-shaped graph, describe the failure mode in Java and in CPython, and state the standard fix.

## 1.5 Integer overflow, signedness and floating-point precision

An integer type stores a fixed number of bits, so it can only hold a bounded range of values.

| Type            | Range                                                             |
| --------------- | ----------------------------------------------------------------- |
| Signed 32-bit   | $-2^{31}$ to $2^{31} - 1$, that is about $\pm 2.1 \times 10^9$    |
| Unsigned 32-bit | $0$ to $2^{32} - 1$, that is about $4.3 \times 10^9$              |
| Signed 64-bit   | $-2^{63}$ to $2^{63} - 1$, that is about $\pm 9.2 \times 10^{18}$ |
| Python `int`    | unbounded                                                         |

What happens when a value leaves the range depends on the language, and this matters more than the range table itself:

- **Java** wraps silently, in two's complement. `int` overflow is defined behavior and it will not throw.
- **C and C++** treat _signed_ overflow as undefined behavior, and _unsigned_ overflow as defined wrapping. A `long long` counter is therefore safe to wrap, and an `int` counter is not.
- **Python** integers are arbitrary precision, so overflow does not exist.

Floating point is a separate trap. A `double` stores a 64-bit value with a 53-bit significand, so it represents integers exactly only up to $2^{53} \approx 9.0 \times 10^{15}$. Below that magnitude the problem is not magnitude but representation: $0.1$ is not representable in binary, so $0.1 + 0.2 \ne 0.3$ exactly, and the same is true of every decimal fraction.

::: math counterexample Float equality
In IEEE 754 double precision, `0.1 + 0.2 == 0.3` evaluates to false. The left-hand side is the double nearest to $0.30000000000000004$, which is not the double nearest to $0.3$. Comparing floating-point values for equality with `==` therefore fails on values that are mathematically equal.
:::

**Why it matters.** Count the pairs of $n$ items: with $n = 10^6$ there are $n(n-1)/2 \approx 5 \times 10^{11}$ pairs, which overflows a 32-bit integer by a factor of about 233. In Java the answer silently comes out negative, and in C++ the behavior is undefined.

**Worked example.** A contest problem with $n \le 10^6$ asks for the number of increasing pairs. The answer is at most $10^6 \cdot 999999 / 2 = 499999500000$, which fits in a signed 64-bit integer. In Java the counter must be declared `long`. In C++ it must be `long long`. Writing `int answer` produces a wrong answer with no error message at all.

**What you must get right.** Promote to 64 bits as soon as a count can exceed $2^{31}-1$, and check the _intermediate_ products, not only the final answer. A product of two 32-bit values can overflow even when each factor is small. Never compare floats with `==`; use integer arithmetic whenever the values are integers, and a tolerance when they are not.

### Checkpoint

**Conceptual.**

1. Give the exact ranges of a signed 32-bit integer, an unsigned 32-bit integer, and a signed 64-bit integer. Which of the three holds $5 \times 10^{11}$, and which holds $-10^{18}$?
2. State what happens on overflow in Java, in C++ for a signed type, in C++ for an unsigned type, and in Python. Why are the C++ answers different?
3. A `double` has a 53-bit significand. State the largest integer it represents exactly, and explain why `$0.1 + 0.2 \ne 0.3$` even though all three numbers are far below that bound.

**Code reading.**

1. This Java code silently produces a negative answer for an input of $10^6$ items. Say what type the answer needs and why `int` is not enough:

    ```java
    int answer = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            answer++;
    ```

2. This Python code raises no error but computes the wrong thing for $n = 10^6$. Identify the defect and state the fix, without changing the language:

    ```python
    total = 0
    for i in range(n):
        total += n * n
    ```

**Implementation.** Write a routine that computes the number of pairs $(i, j)$ with $i < j$ and $a_i = a_j$, for an array of $n$ integers, where $n$ can be as large as $10^7$. Use a 64-bit counter, and state the maximum possible answer.

**Applied problem.** A problem gives $n \le 10^6$ real numbers in the range $[-10^6, 10^6]$ and asks for their sum. Explain why summing them as `double` in the order given may give a different answer from summing them as `long`, and describe a situation in which the difference is large enough to change the judged verdict.

## 1.6 Binary representation, bits, shifts and masks

An integer is a finite sequence of bits. In base two, $n = \sum_i b_i 2^i$. Bit $i$ has value $2^i$, so bit 0 is 1, bit 1 is 2, bit 2 is 4, and so on. Writing $n$ in binary is just reading those coefficients.

The bitwise operators act on corresponding bits:

| Operator | Name        | Effect on one pair of bits            |
| -------- | ----------- | ------------------------------------- |
| `&`      | and         | 1 only when both bits are 1           |
| `\|`     | or          | 1 when either bit is 1                |
| `^`      | xor         | 1 when the bits differ                |
| `~`      | not         | flips every bit                       |
| `<<`     | left shift  | moves bits left, multiplying by $2^k$ |
| `>>`     | right shift | moves bits right, dividing by $2^k$   |

The most useful idiom is the mask of the low $k$ bits, `x & ((1 << k) - 1)`, which keeps the bottom $k$ bits and discards the rest. The complementary mask `x & ~((1 << k) - 1)` keeps the top bits. Together they give you bit fields without any arithmetic.

Two language details catch people out. In Java, `>>` on a negative number sign-extends and `>>>` shifts in zeros; in C and C++, shifting a negative value right is implementation-defined. And `1 << 31` is undefined in C and C++ when `1` has type `int`, because the result does not fit in the signed type; use `1L << 31`. In Java the same expression is perfectly legal and produces `Integer.MIN_VALUE`.

**Why it matters.** Bit manipulation is the only way to hold a set of $n$ items in one integer, which turns an exponential problem into a polynomial one whenever $n$ is small enough.

**Worked example.** With $n = 20$ items, a bitmask enumerating all subsets needs $2^{20} = 1{,}048{,}576$ masks. If checking each subset costs $O(n)$, the total is about $2.1 \times 10^7$ operations, which finishes comfortably in one second in C++ and is marginal in Python. With $n = 25$ the subset count becomes $33{,}554{,}432$ and the same approach is too slow, which tells you that a different technique is required.

**What you must get right.** A mask of $k$ bits is `(1 << k) - 1`, and you need the `1` to be wide enough: `1L << k` when $k \ge 31$ in C and C++, `1L << k` in Java when $k = 32$, and `1 << k` in Python with no special case at all. A mask of the wrong width is the classic cause of an answer that is correct for small inputs and wrong for large ones.

### Checkpoint

**Conceptual.**

1. Write the binary representation of $13$ and of $-3$ in 8-bit two's complement. Which bit pattern distinguishes a negative number from a positive one?
2. State the effect of `x << k`, `x >> k`, `x & m`, and `x | m` on the bits of `x`, and give the decimal effect of the first two.
3. Give the mask that keeps the low $k$ bits of a value, and explain why the literal `1` must be widened when $k$ is large.

**Code reading.**

1. This C++ expression is undefined behavior. Say why, and give the corrected version for each of the two plausible intents:

    ```cpp
    int high = 1 << 31;
    unsigned long long mask = (1ULL << 32) - 1;
    ```

2. This Java expression compiles and runs but produces a surprising value. Explain it:

    ```java
    int x = 1 << 31;
    System.out.println(x);        // -2147483648
    System.out.println(x >>> 31);  // 1
    ```

**Implementation.** Write a function that returns the number of set bits in a non-negative 64-bit integer, using only shifts, masks and subtractions, with no built-in population count. Then write the same function using the built-in count, and check they agree on $0$, $1$, $2^{63}$, and $2^{64} - 1$.

**Applied problem.** A problem has $n \le 20$ items and asks for the largest subset of pairwise distinct values. Describe a bitmask solution and give its time complexity, including the cost of checking each subset. Then say at what value of $n$ the same approach stops being feasible and what you would try instead.

## 1.7 Pass-by-value and reference-like semantics

Every function receives its arguments somehow, and the mechanism decides what the function can do to the caller's data.

**Java is always pass-by-value.** When you pass an `int`, the callee gets a copy. When you pass an object, the callee gets a copy of the _reference_. The callee can therefore mutate the object, but it cannot rebind the caller's variable to something else.

```java
static void mutate(int[] a)  { a[0] = 99; }        // caller sees 99
static void rebind(int[] a)  { a = new int[5]; }    // caller sees nothing
```

**C++ offers all three.** Pass by value copies. Pass by reference (`T&`) aliases, so writes are visible. Pass by pointer passes an address, which is the same aliasing with more ceremony and an extra dereference. The default in C++ is by value, and for a `std::vector<int>` that default copies the entire vector, including its elements.

**C passes everything by value**, with one exception: an array argument _decays_ to a pointer to its first element, so arrays are effectively passed by reference.

**Python binds names.** Assigning inside a function rebinds the local name. Mutating a list or dict that was passed in is visible to the caller, because the name still refers to the same object.

**Why it matters.** The classic performance bug in C++ is passing a large vector by value in a loop. The classic correctness bug in Java is expecting a callee to be able to rebind the caller's variable.

**Worked example.** A C++ function `void addOne(vector<int> v)` called in a loop over $10^5$ iterations copies the vector $10^5$ times. Changing the signature to `void addOne(vector<int>& v)` copies nothing. The asymptotic cost of the loop changes from $\Theta(n^2)$ to $\Theta(n)$, and the fix is one character.

**What you must get right.** In Java, "pass by value" of a reference means that mutation is visible but reassignment is not. In C++, choose `const T&` for a read-only parameter on a large type, `T&` when you intend to mutate, and `T` only when the copy is cheap or the copy is what you want.

### Checkpoint

**Conceptual.**

1. In Java, every parameter is passed by value. Explain how a method can still change the contents of an object the caller owns.
2. In C++, what is the difference between `T`, `T&`, `const T&`, and `T*` for a parameter of a large type? Which one should a read-only function take?
3. Why does C++ allow an array parameter to behave like a pointer, while Java arrays behave like objects?

**Code reading.**

1. This Java method's change is not visible to the caller. Say exactly which operation is invisible, and rewrite the method so the caller sees the change:

    ```java
    static void rebind(int[] a) { a = new int[5]; }
    ```

2. This C++ function makes a copy of a vector of $10^6$ integers on every call. Name the parameter kind that avoids the copy, and the one that makes the mutation visible to the caller:

    ```cpp
    void addOne(std::vector<int> v) { v.push_back(1); }
    ```

**Implementation.** Write a C++ function `long long countPairs(const std::vector<int>& v)` that counts equal pairs, and a Java method with the same contract. Report the space complexity of each and explain why the C++ signature differs from the obvious one.

**Applied problem.** A contest solution in Java passes a `List<String>` of $2 \times 10^5$ tokens to a helper for every one of $10^5$ queries. Describe the fix in both Java and C++, and state the time complexity of the original and the fixed versions.

## 1.8 Standard input, output, tokenization and buffering

Contest input is a stream of bytes. The formal specification describes a sequence of _tokens_ separated by whitespace, and the line breaks in the file are not part of the contract. A token that happens to sit at the end of a line is the same token as one in the middle of a line.

This is the single most common source of input bugs, because the natural mental model of a program is line-oriented. Read the whole input, split it into tokens, and index the token array. Do not assume that the second integer is on the second line.

**Buffering** is the other half. An unbuffered read asks the operating system for a few bytes at a time, and each such request is a system call. A buffered reader requests a block of bytes at once and hands out pieces from memory. The difference is not small: reading $10^7$ integers one byte at a time is roughly three orders of magnitude slower than reading them through a 64 KB buffer.

For output, the same logic applies in reverse. Building one large string and writing it once is far cheaper than many small writes. In C++, prefer `'\n'` to `std::endl`, because `endl` flushes the stream on every call. In Java, wrap `System.out` in a `PrintWriter` with an explicit buffer, or accumulate into a `StringBuilder` and print once.

**Why it matters.** Several contest solutions are correct and still fail, purely on input handling speed. The classic example is Java's `java.util.Scanner`: it parses tokens with regular expressions and performs a lookup per token, and it is far slower than a buffered reader on the same input, by roughly an order of magnitude. A contest program that reads a few million integers with `Scanner` can time out where the identical program with a hand-written `FastScanner` finishes in a fraction of the limit.

**Worked example.** The same task in three languages:

```python
import sys
data = sys.stdin.buffer.read().split()
n = int(data[0])
values = list(map(int, data[1:1 + n]))
```

```cpp
#include <cstdio>
int n;
if (scanf("%d", &n) != 1) return 0;
std::vector<int> v(n);
for (int &x : v) scanf("%d", &x);
```

```java
// A FastScanner over a 64 KB buffer, as used throughout this project.
final int value = fs.nextInt();
```

All three read the same token stream. Only the third is fast enough for inputs with tens of millions of tokens, and even then it is close to the limit.

**What you must get right.** Tokenisation ignores line structure, so build your input as an array of tokens and read positions from it. Turn buffering on before you worry about anything else in your input path.

### Checkpoint

**Conceptual.**

1. Explain why reading input line by line is fragile, given that the specification describes tokens rather than lines. Give an input file that breaks a line-oriented reader but not a token-oriented one.
2. What does buffering do, and why does it change the cost of reading $10^7$ integers by orders of magnitude?
3. Why is `std::endl` slower than `'\n'` in C++ output, even when the total output is small?

**Code reading.**

1. This Java program reads three integers. Say which input layouts it accepts and which it rejects, and rewrite it to accept all valid layouts:

    ```java
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    int n = Integer.parseInt(br.readLine());
    int a = Integer.parseInt(br.readLine());
    int b = Integer.parseInt(br.readLine());
    ```

2. This C++ program reads the number of test cases and then the values, but reads the values one line at a time. Identify the bug and rewrite the loop.

**Implementation.** Write a fast integer reader in C++ using a 64 KB buffer over `std::cin.read`, and one in Java using a 64 KB buffer over `System.in`. Both must handle negative numbers and must return a sentinel at end of input.

**Applied problem.** A problem's input contains $3 \times 10^7$ tokens. Estimate the wall-clock time of reading them with `std::cin` and with `scanf` in C++, and with `Scanner` in Java. Then say which input method you would use and why.

## 1.9 Compiler errors, runtime errors and wrong answers

Three distinct failure modes exist, and confusing them wastes time.

**Compilation errors** mean the program never ran. The compiler rejected it before execution, so you get a message with a line number, and the cost is zero against your time limit. These are the cheapest kind of failure.

**Runtime errors** mean the program started and then failed. In Java an out-of-range array access throws `ArrayIndexOutOfBoundsException` and the process exits with a non-zero status; in C++ the same mistake is undefined behavior and may do nothing at all; in Python it raises `IndexError`. The judge may report this as a runtime error, or as a timeout, or as a wrong answer, depending on what the undefined behavior happened to do.

**Wrong answers** mean the program ran to completion and produced output that did not match the expected output. This is the hardest mode, because there is no crash, no stack trace, and no line number. A wrong answer usually means a logic error, an overflow, an off-by-one, or an input assumption that failed on a test case you did not try.

The difference between modes is worth internalising, because it tells you where to look. A crash points at a specific line. A wrong answer points at an assumption.

**Worked example.** The loop `for (int i = 0; i <= n; i++)` over an array of length $n$ reads one element past the end. In Java that is an exception pointing at the exact line. In C++ with `operator[]` it is undefined behavior: it may read garbage, it may crash, or it may appear to work, and the judge may report "wrong answer" with no clue. In Python it raises `IndexError` and names the line. Using `at()` instead of `operator[]` in C++ turns the silent case into an exception, which is worth it during development even though it costs performance.

**What you must get right.** The judge tells you the _verdict_, not the _reason_. When the verdict is wrong answer, your debugging has to begin from scratch: build a small case you can check by hand, find an input that distinguishes the correct answer from yours, and shrink it. That process is the subject of module 6.6.

### Checkpoint

**Conceptual.**

1. Name the three failure modes a submission can have, and say which one the judge reports with a line number attached.
2. Why does a wrong answer give you less information than a crash? What specifically must you reconstruct yourself?
3. Why do judges usually run each test case as a separate process, and what does that do to the information a verdict carries?

**Code reading.**

1. This C++ loop reads one element past the end of the vector. Say what the language standard permits, what Java does with the equivalent code, and what Python does:

    ```cpp
    for (size_t i = 0; i <= v.size(); i++) sum += v[i];
    ```

2. This Java program reports "wrong answer" on the judge but appears to work locally. Name the most likely cause from this module, and say which C++ construct would have produced a crash instead.

**Implementation.** Write a small program that reads a list of integers and a target value, and prints the indices of every pair that sums to the target. Test it on the boundary cases: an empty list, a one-element list, a list with one element equal to the target, and a list containing the target twice. State what each case should print and check that your program agrees.

**Applied problem.** A submission is reported as a runtime error on a single test case out of ten. Describe, in order, the steps you would take to find the cause, and say which of the three failure modes you initially suspect and why.

## 1.10 The judging system and why programs must be deterministic

A judge does four things: it compiles your program, runs it against a set of test cases, compares your output with the expected output for each case, and reports a verdict.

Typical verdicts are accepted, wrong answer, runtime error, time limit exceeded, memory limit exceeded, and compilation error. Each test case is usually run as a fresh process with a fresh time and memory allowance, so a crash on test case 5 is reported as a runtime error even if test cases 1 to 4 were all correct. That is why a program that "worked on the samples" can still fail.

Output comparison is normally token-based: the judge splits both outputs into tokens and compares the sequences. Whitespace differences are usually tolerated, but the values must match exactly, and there is normally no numeric tolerance. An output of `0.333333` where `0.3333333` was expected is a wrong answer.

The deeper requirement is determinism: for a fixed input, the program must produce a fixed output, every time, on the judge's machine. This rules out several things that look harmless:

- Unseeded randomness. `rand()` in C and C++ without `srand()` gives a different sequence on every run.
- Wall-clock time. `time(nullptr)` used as a seed makes the output depend on when the program ran.
- Iteration order over unordered containers. The iteration order of a C++ `std::unordered_map` is unspecified, so printing a map's contents can produce a different order on a different run.
- String hash randomisation. CPython randomises the hash of `str` objects per process unless `PYTHONHASHSEED` is set, so the iteration order of a Python `set` of strings varies between runs.
- Environment variables, the working directory, the locale, and the standard input's trailing whitespace.

**Why it matters.** A non-deterministic solution is not merely unlucky. It may pass locally, pass on the judge once, and fail on the next attempt, and you will have no way to reproduce the failure. Worse, in a multi-test case contest, some cases pass and others do not, which makes the verdict look like a logic error rather than a design error.

**Worked example.** A Monte Carlo approach to a counting problem uses random sampling to estimate an answer, then prints it. It passes most of the time. Under the judge's rules it must not exist in that form, because a correct submission has to be correct on every run. The same problem solved with a deterministic algorithm has no such problem: same input, same output, always.

**What you must get right.** Any randomised element must be driven by a fixed seed, and you should be able to reproduce the exact behavior of a judge run locally. Never rely on the iteration order of a hash-based container. Treat the input as a stream of tokens that ends at an arbitrary point, and treat your output as a sequence of values compared exactly.

### Checkpoint

**Conceptual.**

1. List the steps a judge takes, in order, and say which of them your program controls.
2. Explain why determinism is a requirement on the program rather than a property of the environment. Give two specific sources of non-determinism in a deterministic language.
3. Why do judges compare output token by token rather than byte by byte? What kind of mistake does that tolerate, and what kind does it still catch?

**Code reading.**

1. This C++ program prints the contents of a hash map. Say why the output order is not guaranteed, and give a rewrite whose output is deterministic:

    ```cpp
    for (const auto& [k, v] : counts) std::cout << k << ' ' << v << '\n';
    ```

2. This Python program counts characters in a set of strings and prints the set. Explain why the output can differ between two runs of the same program, and name the environment variable that controls it.

**Implementation.** Write a program that shuffles a list of $n$ items using a fixed-seed generator, and verify that two separate runs produce identical output. Then replace the fixed seed with a time-based one and explain, in one sentence, why that version could not be submitted.

**Applied problem.** A problem asks for "the pair with the largest second component", and the specification says to print any such pair. Your solution stores candidates in a hash map and prints the first one found. Explain precisely why this can produce different answers on different runs, and rewrite the last three lines so that the output is fixed.

## Review checklist

You are ready for part 2 when you can answer the following without consulting the text.

- Explain why a signed integer overflow in C++ is a worse problem than the same overflow in Java, and what each language actually does.
- State the difference between "the language is compiled" and "the program is fast", and give one contest-sized example of each.
- Given a Java method with an `ArrayList` parameter, say precisely which changes to that list are visible to the caller and which are not.
- Compute the depth of a recursion that calls itself once per element of an array of length $n$, and say what happens at depth $10^5$ in Java and in CPython.
- Decide, for a problem needing 64-bit counters, what type to use in Java, C++, and Python, and say what each language does when the counter exceeds its range.
- Explain why `0.1 + 0.2 != 0.3` in double precision, and state the condition under which a double represents an integer exactly.

Next: [Algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis).
