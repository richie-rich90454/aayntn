---
id: foundations.recursion
title: Recursion
summary: Solve a problem by solving smaller instances of the same problem, and know when the call stack will not survive the input you were given.
division: [bronze, silver]
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords:
    [
        recursion,
        call stack,
        stack frame,
        activation record,
        tail call,
        explicit stack,
        structural induction,
        backtracking,
    ]
prerequisites:
    required: [start.computational-foundations]
    recommended: [foundations.complexity, graphs.dfs]
complexity:
    time: "the cost of its recurrence"
    space: "O(d) for the call stack"
assumptions:
    - The recursion is over a well-founded order, so that every chain of recursive calls ends.
    - The depth of the recursion is known to be within the call stack limit of the language in use.
reviewed: false
---

## At a glance

Recursion is a way of solving a problem by solving smaller instances of the same problem until the instances become trivial. It has two parts: a base case that stops the descent, and a recursive case that reduces the input and calls the function again.

The reason a recursion needs a stack is that the function cannot finish until the calls it made have finished. Each unfinished call occupies a **stack frame** on the **call stack**, and the frames are released in last-in, first-out order when the calls return. The depth of the recursion is the number of frames that exist at the deepest moment, and that depth is a function of the input, not a property of the algorithm.

Everything difficult about recursion is downstream of that one fact. The frame is a fixed cost, the stack has a fixed size, and a problem whose input can produce a million nested calls will not run in a language whose stack holds ten thousand frames. When that happens, the fix is mechanical: keep the pending calls in an explicit stack on the heap instead.

The article agrees with the academy's treatment of the machine model in [computational foundations](/start/from-ap-csa/part-1-computational-foundations) and does not repeat it. What follows is the recursion-specific material: the frame, the depth, the conversion, and the language limits.

## Problem motivation

Consider a chain of $n$ linked nodes, where each node holds a value and a pointer to the next. The question is: what is the sum of the values?

The iterative answer is three lines and a pointer walk.

```cpp
long long sum(const Node* p) {
    long long total = 0;
    while (p != nullptr) {
        total += p->value;
        p = p->next;
    }
    return total;
}
```

The recursive answer is three lines too.

```cpp
long long sum(const Node* p) {
    if (p == nullptr) return 0;
    return p->value + sum(p->next);
}
```

Both are correct, and both cost $O(n)$ time. The difference appears when $n$ gets large. The recursive version holds one frame per node still on the chain, so its depth is $n$. With a chain of $10^6$ nodes and a frame of 64 bytes, the recursive version needs 64 MB of stack, and the default stack on Linux is 8 MB. The program dies with a segmentation fault having summed about 13 percent of the list. The iterative version uses a fixed number of variables and finishes normally.

Nothing about the algorithm changed. Only the depth did, and the depth is a function of the input. That is the whole subject of this article.

## Recognition patterns

Recursion is the right tool when the problem is _defined_ in terms of smaller instances of itself, and when the depth of that definition is small.

- **Divide and conquer.** The problem splits into two or more smaller instances of the same kind. Merge sort, quicksort, and binary search all have this shape, and all of them have depth $O(\log n)$.
- **Tree and graph traversal.** A vertex is processed, then each of its unvisited neighbors is processed the same way. The depth is the depth of the tree, which is small for a balanced tree and large for a path.
- **Backtracking.** A choice is made, the consequences are explored, and the choice is undone when the branch fails. The depth is the length of the partial solution.
- **Parsing.** A nested structure is read by reading the thing inside it, which has the same grammar.
- **Definitions by induction.** The mathematical objects themselves are defined recursively: a tree is a leaf or a node with subtrees, a list is empty or a head with a tail.

The two tests that decide it are the depth test and the call-count test. The depth test asks how many calls can be pending at once; the call-count test asks how many calls happen in total. A recursion that has depth $O(\log n)$ and makes $O(n)$ calls is safe. A recursion that has depth $n$ and makes $O(n)$ calls is a memory problem. A recursion that has depth $n$ and makes $2^n$ calls is a time problem, and the fix is memoization rather than an explicit stack.

## Naive approach

The naive approach to recursion is to write it recursively and hope.

```cpp
long long sum(const Node* p) {
    if (p == nullptr) return 0;
    return p->value + sum(p->next);
}
```

This code is correct for the inputs it survives. The problem is that nothing in the code says how deep it goes, and the depth is not visible at the call site: the function looks like it does constant work.

The second naive approach is to convert everything to iteration by hand, every time, without deciding whether it is needed. That produces long programs that are harder to read than the recursion they replaced, and it does not remove the need to know the depth: an explicit stack has a limit too, although a limit of millions of entries rather than thousands of frames.

The third naive approach is to raise the recursion limit when the program crashes. In Python this changes a counter and not the machine: the interpreter still allocates a C stack frame for every Python-level call, so raising the limit converts a clean `RecursionError` into a crash of the whole interpreter, or into a segmentation fault.

## Key insight

The insight is that the call stack _is_ a data structure, and that recursion is a way of using it without naming it.

When a function calls another function, the runtime pushes a frame describing the pending call. When the callee returns, the frame is popped. The discipline is last-in, first-out, because the most recent call is the one that finishes first.

This gives recursion its two defining properties. First, the work is done when the call _returns_, not when it is made, so the frames pile up in the order the calls were made. Second, the depth of the recursion is exactly the length of the longest chain of calls that has not yet returned, which is usually the depth of the structure being traversed.

Once the call stack is understood as a data structure, two moves are available. Use it, when the depth is small, and get a program that is short and obviously correct. Or replace it with an explicit stack on the heap, when the depth is large, and get a program that cannot overflow.

## Formal model

Let $D$ be a domain equipped with a well-founded relation $<$, and let $f : D \to R$ be the function being computed.

::: math definition Definition
A function $f$ is defined **recursively** on $D$ if there is a set $B$ of
**base cases** and a rule that assigns $f(x)$ for every $x \notin B$ in
terms of $f(y)$ for $y < x$. The function is **well-founded** if every
chain $x_0 > x_1 > x_2 > \cdots$ is finite, which guarantees that the
recursion terminates.
:::


::: math definition Definition
The **depth** of a recursive computation is the maximum number of calls that
are active at the same moment. Each active call occupies one **stack
frame** on the call stack, so the memory needed by the recursion is the
depth multiplied by the size of a frame.
:::


::: math definition Definition
A recursive call is in **tail position** if it is the last computation the
function performs, so that the function's own frame can be discarded before
the call returns. A language with **proper tail calls** executes such a call
in constant stack space.
:::


::: math lemma Lemma
A recursion that traverses a path of $n$ vertices has depth $n$.
:::


::: math lemma Lemma
A recursion over a balanced binary structure of $n$ leaves has depth
$\lceil \log_2 n \rceil + 1$, because each level of the recursion consumes
one level of the structure.
:::


These two lemmas are the whole basis for the decision. A balanced tree of a million leaves has a depth of about 21, which every language handles. A path of a million vertices has a depth of a million, which no language handles by default.

## Algorithm derivation

### The recursive form

The recursive depth of a tree is one plus the larger of the depths of the two subtrees, and an empty tree has depth zero.

```cpp
int depth(const Tree& t) {
    if (t.empty()) return 0;
    return 1 + std::max(depth(t.left()), depth(t.right()));
}
```

The state is the subtree being examined. The update is the recursive call on each child. The correctness comes from the fact that a subtree is smaller than the tree that contains it, so the recursion terminates, and from a structural induction over the tree.

### The explicit-stack form

The same computation with the pending calls held in a vector on the heap:

```cpp
int depth(const Tree& t) {
    struct Frame { const Tree* node; int depthSoFar; };
    std::vector<Frame> pending{{&t, 0}};
    int deepest = 0;
    while (!pending.empty()) {
        Frame f = pending.back();
        pending.pop_back();
        if (f.node->empty()) continue;
        int d = f.depthSoFar + 1;
        deepest = std::max(deepest, d);
        pending.push_back({&f.node->left(), d});
        pending.push_back({&f.node->right(), d});
    }
    return deepest;
}
```

The frame now holds two things the call stack used to hold for free: the node being examined and the depth accumulated so far. Everything else is unchanged.

### The conversion recipe

Converting a tail-recursive function into a loop takes four steps, in this order.

1. **Find the call in tail position.** It is the last statement of the function, and nothing is computed from its result.
2. **Name the pending arguments.** Every argument of the recursive call becomes one element of the explicit stack.
3. **Replace the call with a push, and wrap the body in a loop** that pops the next pending call and runs the body on it. The base case becomes the condition that ends the loop.
4. **Move the result out of the function.** A tail-recursive function returns the same value for every input, so the accumulated value has to travel through the loop explicitly, usually as an extra parameter.

```cpp
long long fact(long long n) {
    long long acc = 1;
    while (n > 1) {
        acc *= n;
        --n;
    }
    return acc;
}
```

The version with an accumulator and a tail call is the same program written recursively, and it is the one that overflows:

```cpp
long long fact(long long n, long long acc = 1) {
    return n <= 1 ? acc : fact(n - 1, acc * n);
}
```

In C++ this makes one frame per call, because C++ does not guarantee tail call elimination. In Haskell, OCaml, Scheme, and Rust with a `become` block, the same function runs in constant stack space. The difference is a property of the language, not of the program.

## Step-by-step execution

Take the recursive depth of a tree whose root has a left leaf and a right child that has two leaves.

1. `depth(root)` is called. The root is not empty, so it calls `depth(left)`.
2. `depth(left)` is called. The node is a leaf, so `depth(left.left)` and `depth(left.right)` are both called and both return $0$ immediately. The leaf's depth is $1$.
3. Back in the root's frame, `depth(right)` is called.
4. `depth(right)` calls `depth(right.left)` and `depth(right.right)`, which are leaves and return $1$ each. So `depth(right)` returns $2$.
5. The root returns $1 + \max(1, 2) = 3$.

The depth of the recursion is three frames at the deepest moment: root, right child, right grandchild. The explicit-stack version performs exactly the same three nested states, with the vector holding the pending left subtrees.

## Correctness proof

::: math theorem Theorem
For a binary tree $T$, let $d(T)$ be the number of vertices on the longest
path from the root to a leaf. The recursive function `depth` returns $d(T)$
for every tree $T$, and terminates.
:::


::: math proof Proof
We prove the claim by structural induction on the number of vertices of $T$.

**Base case.** If $T$ is empty, the function returns $0$ immediately, and $d(T) = 0$ because there is no path. The function terminates.

**Inductive step.** Let $T$ be a nonempty tree with root $r$, left subtree $L$, and right subtree $R$. Both $L$ and $R$ have fewer vertices than $T$, so by the induction hypothesis the calls `depth(L)` and `depth(R)` terminate and return $d(L)$ and $d(R)$. The function then returns $1 + \max(d(L), d(R))$.

Every path from $r$ to a leaf begins at $r$ and then continues into either $L$ or $R$. The longest such path therefore has length $1 + \max(d(L), d(R))$, which is exactly what the function returns. The function terminates because its two recursive calls are on strictly smaller trees, and the induction applies to both of them. $\square$
:::


::: math theorem Theorem
The explicit-stack version returns the same value as the recursive version.
:::


::: math proof Proof
At any moment of the explicit-stack computation, the vector holds exactly
the calls that the recursive version would have pending, in the same
last-in, first-out order: the recursive version pushes a call for each
child and evaluates the last child first, and the explicit version pushes
the left child and then the right child and pops the right child first.

Induct on the number of pending calls. When the vector is empty, the recursive version has no pending call either, and both have returned the same value. When the vector is not empty, both computations examine the same subtree and at the same accumulated depth, and both then push the two children and record the same candidate maximum. By the induction the two computations agree on every value they record, and in particular on the maximum returned. $\square$
:::


## Complexity analysis

The time of a recursive function is the cost of its recurrence relation, solved with the master theorem or by a direct argument. The space is the sum of two things that are usually confused with each other.

- **Time.** The total number of calls, multiplied by the work per call. A recursion with $T(n) = 2T(n/2) + O(n)$ costs $O(n \log n)$; a recursion with $T(n) = T(n-1) + O(n)$ costs $O(n^2)$; a naive recursion with $T(n) = T(n-1) + T(n-2) + O(1)$ costs $O(\varphi^n)$ where $\varphi = \frac{1+\sqrt5}{2}$. The bounds are discussed in [complexity analysis](/algorithms/foundations/complexity).
- **Auxiliary space.** The recursive version uses one frame per pending call, so its space is $O(d)$ where $d$ is the depth. The explicit-stack version uses one entry per pending call in a heap container, so its space is the same $O(d)$, but the constant is different: an entry in a vector of two integers costs eight bytes, where a frame in Java costs hundreds.

The important asymmetry is that the recursive version's space is bounded by the machine's stack, which is a fixed and small number of megabytes, while the explicit version's space is bounded by the heap limit, which is a hundred times larger. The algorithm that uses more memory can be the one that uses less of it.

## Algorithm selection

| Situation                              | What to use                                            |
| -------------------------------------- | ------------------------------------------------------ |
| Depth is $O(\log n)$                   | Recursion; it is shorter and clearer                   |
| Depth is bounded by a small constant   | Recursion; the frame cost does not matter              |
| Depth is $O(n)$ and the input is large | Explicit stack on the heap                             |
| Structure is a tree of unknown height  | Explicit stack, or recursion after checking the height |
| Number of calls is exponential         | Memoization or a bottom-up formulation first           |
| The recursion is a backtracking search | Recursion for small depths, explicit stack otherwise   |

## Recursion decision

The stack limits differ in every language, and the numbers below are orders of magnitude rather than guarantees. They agree with the table in [computational foundations](/start/from-ap-csa/part-1-computational-foundations).

| Language | Where the stack comes from | Depth before failure | Failure mode |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux by default, changed with `ulimit -s` | about $10^5$ to $10^6$ frames | segmentation fault |
| Java | 512 KB to 1 MB per thread, set with `-Xss` | about $10^3$ to $10^4$ frames | `StackOverflowError` |
| CPython | the operating system stack plus an interpreter counter | 1000 frames by default | `RecursionError` |
| Pascal | the operating system stack | platform dependent | runtime error or a crash |
| JavaScript | the engine's own stack | about $10^4$ frames | `RangeError: Maximum call stack size exceeded` |

Three consequences follow.

First, the failure is a crash, not a wrong answer. In Java the `StackOverflowError` is an `Error` and is not caught by `catch (Exception e)`. In C the process dies. A contest submission that crashes scores nothing, however correct the algorithm is.

Second, Python's limit is a counter and not a guard. `sys.setrecursionlimit` raises the number of Python-level calls the interpreter allows, and the C stack still has to hold the frames. Raising it to a large value turns a clean exception into a segmentation fault of the interpreter.

Third, tail calls do not help in most contest languages. C++, Java, Python, and JavaScript make no promise about eliminating a tail call, and the optimizer in C++ may or may not do it. Only a handful of languages, mostly functional ones and Rust's `become` blocks, guarantee constant stack usage for a tail call. A tail-recursive function written for a contest is a recursive function with extra steps.

## Implementation walkthrough

Two lines carry the whole difference between the two forms.

The recursive version:

```cpp
if (p == nullptr) return 0;
return p->value + sum(p->next);
```

The explicit version:

```cpp
while (p != nullptr) {
    total += p->value;
    p = p->next;
}
```

The recursive version's frame must survive until the callee returns, because the addition happens after the call. That is why it cannot be converted by a local edit. A tail-recursive version, where the recursive call is the last thing the function does, can be converted mechanically, because the frame has nothing left to do.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| No base case | Infinite recursion, then a crash | Write the base case first |
| The base case is wrong | Wrong answer, no crash | Test the smallest input |
| The recursive case does not reduce the input | Infinite recursion | Make every step strictly smaller |
| Recursion over a long chain | Stack overflow | Convert to an explicit stack |
| Raising the Python recursion limit | A crash instead of an exception | Convert to an explicit stack |
| Assuming a tail call is free in C++ | Stack overflow | Use a loop |
| Recomputing the same subproblem | Exponential time | Memoize, or write it bottom-up |
| Forgetting that the depth is a function of the input | A program that passes small tests and fails large ones | Compute the depth before choosing the form |

### Why this fails: the chain of a million vertices

The plausible wrong approach is to write the recursive traversal because the recursive version is short, correct, and reads like the definition of the problem. The counterexample is a legal input.

Take a path graph on $10^6$ vertices, that is, a chain $0 - 1 - 2 - \dots - 999\,999$, and search it from vertex $0$. Every vertex is reachable, so the answer is $10^6$, and the traversal is trivially correct. The recursive form, however, makes one nested call per vertex.

In C++ on Linux the default stack is 8 MB and a frame for a typical recursive search occupies roughly 64 bytes, so the recursion dies after about $130\,000$ frames. The program prints nothing and exits with a segmentation fault, having visited 13 percent of the graph. In Java the same program throws a `StackOverflowError` after roughly $10^4$ frames. In Python it throws a `RecursionError` at 1000 frames, and raising the limit to $10^6$ only moves the crash from the interpreter to the operating system.

The explicit-stack version traverses the same chain with the pending vertices in a vector on the heap and finishes normally, using about 4 MB for $10^6$ 32-bit vertices.

The input is legal, the constraints are met, and the answer is well defined. Only the choice of implementation is wrong, and the choice was made by looking at the code instead of at the input.

The lesson generalizes: **the recursion depth is a function of the input, and it must be measured against the stack limit of the language before the recursive form is chosen.**

## Variants and extensions

- **Memoization.** Cache the result of each subproblem in a table. It turns an exponential recursion into a polynomial one at the cost of a table, and it is the right answer whenever the same subproblem recurs.
- **Bottom-up iteration.** When the recursion is over a sequence and the recurrence reads only earlier positions, the loop is usually faster than the recursion and never overflows.
- **The explicit-iterator traversal.** To reproduce the exact visit order of a recursive depth-first search with $O(V)$ space, store the index of the next neighbor to examine next to each vertex and pop a vertex only when its neighbor list is exhausted.
- **Generators and iterators.** A generator turns a recursive traversal into a lazy sequence, which changes the depth question into a memory question about how much of the sequence the consumer holds.

## Contest strategy

1. Write the base case first, and test it on the smallest input.
2. Decide the depth before the form. Ask what the maximum depth is for the largest allowed input, and compare it with the table of stack limits.
3. If the depth is larger than about $10^4$, plan for an explicit stack from the start rather than converting afterwards.
4. Count calls, not depth, when you estimate the time. A recursion that calls itself twice is exponential unless you memoize.
5. Keep the recursive version in your notes even when you submit the iterative one. The recursive version is the specification, and the iterative version is the implementation of that specification.
6. When you convert, write the accumulator explicitly. A tail-recursive function that returns its result has nowhere to put the result once the frame is gone.

## Worked problems

### Problem 1: the depth of a tree

**Restatement.** Given a binary tree with up to $10^6$ nodes, report the number of nodes on the longest path from the root to a leaf.

**Naive baseline.** The recursive function above. It is correct and it overflows the stack on a path-shaped tree with $10^6$ nodes.

**Insight.** The answer is a maximum over the subtrees, and the maximum can be accumulated while the traversal runs.

**Derivation.** Keep a stack of pending nodes, each with the depth reached so far. Pop a node, update the maximum, and push its children with the depth increased by one.

**Correctness.** By the structural induction above, the recursive and the explicit versions return the same value, and the recursive version returns the longest path length.

**Complexity.** $O(n)$ time and $O(d)$ auxiliary space, where $d$ is the depth, in both versions. The explicit version trades a stack limit of $10^4$ frames for a heap limit of millions of entries.

**Common wrong approach.** Updating the maximum when a node is pushed rather than when it is popped, which counts the depth of a node rather than the depth of the longest path.

### Problem 2: the sum of a chain

**Restatement.** Given $n$ linked nodes, report the sum of their values. Constraints: $n \le 10^6$.

**Naive baseline.** The recursive sum. It overflows the stack in every language.

**Insight.** The sum does not need a return value from the recursive call, so the call is in tail position once the accumulator is made explicit.

**Derivation.** Carry an accumulator as a parameter, or use a loop.

**Correctness.** The accumulator holds the sum of the values of the nodes already visited, by induction on the number of visited nodes.

**Complexity.** $O(n)$ time and $O(1)$ auxiliary space for the loop version, against $O(n)$ space for the recursion.

**Common wrong approach.** Writing the accumulator version and believing it is constant space because the accumulator is a single number. The frames are still on the stack.

### Problem 3: flattening a nested structure

**Restatement.** Given a nested list of integers of arbitrary depth, report the sum of all the integers.

**Naive baseline.** A recursive traversal. The depth is the depth of the input, which the statement does not bound.

**Insight.** The depth of the _input_ is the depth of the recursion, so the input must be bounded, or the traversal must use an explicit stack.

**Derivation.** Either impose a depth limit on the input, or push the pending lists onto a heap-allocated stack.

**Correctness.** Each list contributes its own head plus the sums of its nested lists, and the traversal visits every list exactly once.

**Complexity.** $O(N)$ time where $N$ is the total number of nodes in the structure, and $O(d)$ space where $d$ is the maximum nesting depth.

**Common wrong approach.** Assuming the input is shallow because the statement says nothing about depth, and then failing on the one test case with a 200,000 level nest.

## Practice progression

1. **Recognition.** Given a recursive function, identify its base case, its recursive case, and its depth.
2. **Direct application.** Write the recursive version and the explicit stack version of a tree traversal, and check that they agree.
3. **Adaptation.** Convert three functions to the explicit form using the recipe, and measure the difference in memory.
4. **Combination.** Combine recursion with memoization to remove the exponential blow-up, and compute the memory of the cache.
5. **Challenge.** Write a recursion whose depth is $O(\log n)$ on a balanced structure and $O(n)$ on a degenerate one, and explain why the same code passes one test and crashes on another.
6. **Transfer.** Use the explicit-stack form for a problem that has no natural recursion at all, such as evaluating an expression given in postfix notation.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What does the runtime store in one stack frame, and why must the frames be released in last-in, first-out order? (Formal model)
2. Why is the depth of a recursion a function of the input rather than of the algorithm? (Formal model)
3. State the depth of a recursion over a balanced binary tree and over a path of $n$ vertices. (Formal model)
4. Give the four steps of the conversion recipe, in order. (Algorithm derivation)
5. Why does a tail call save space in Haskell but not in Java, and what does that tell you about contest languages? (Recursion decision)
6. What is the failure mode of deep recursion in each of the five languages, and is the exception catchable? (Recursion decision)
7. Give the smallest counterexample that crashes the recursive form of a traversal, and name the failure mode in each language. (Common mistakes)
8. Why does raising the Python recursion limit not make deep recursion safe? (Recursion decision)
9. How do the recursive and the explicit-stack versions differ in space, and which one is bounded by the smaller limit? (Complexity analysis)
10. How do you convert a tail-recursive function into a loop, and where does the accumulated result live? (Implementation walkthrough)

## Further reading

- The machine model behind the frame, including where the stack lives and what happens when it is exhausted, is in [computational foundations](/start/from-ap-csa/part-1-computational-foundations).
- The bounds for recursive algorithms are in [complexity analysis](/algorithms/foundations/complexity).
- The traversal whose recursion depth is the depth of a graph is in [depth-first search](/algorithms/graphs/dfs), with the iterative form and the marking decisions that go with it.
- The recursive technique that deliberately explores every branch is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
