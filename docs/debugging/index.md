---
id: debugging.overview
title: The debugging laboratory
summary: How to turn a wrong answer, a runtime error or a time limit exceeded into a specific, proven fix.
division: []
subjects: []
level: intermediate
importance: core-prerequisite
keywords:
    [debugging, wrong answer, runtime error, time limit, differential testing, adversarial input]
prerequisites:
    required: []
    recommended: [start.contest-literacy, start.algorithm-analysis]
reviewed: false
---

A verdict is a symptom. The judge tells you that your program did not produce what it wanted, and it tells you nothing else. Everything expensive in competitive programming happens in the gap between that sentence and the one-line fix.

This laboratory is about that gap. It is organized the way the work actually proceeds: the three verdicts are three different kinds of bug, the method for narrowing a bug is a fixed sequence of steps, the strongest tool you have is a machine-checked comparison against a second implementation, and the inputs you must construct by hand are the ones random testing will never produce.

Everything here is about making a failure specific. A specific failure has a cause; a vague failure has a search.

## The three failures, and how to tell them apart

A judge returns one of three verdicts, and each one points at a different part of your program.

### Wrong answer

**What it looks like.** The program compiled, ran to completion, exited normally, and produced output that does not match the expected output. The judge may report the first line on which the two disagree, or it may report nothing beyond the verdict, depending on the competition.

**What causes it.** A wrong answer means the program ran and computed something. The candidates, in rough order of how often they are the answer: an off-by-one at a boundary, an uninitialized variable, an integer overflow, a transition that is invalid but plausible, a greedy choice that is not actually safe, an index base mismatch between two parts of the program, or a completely wrong idea.

**The debugging path.** The output is wrong, and you do not know where. Start from the smallest input that produces the wrong output, then bisect it: find the first index at which your output and the expected output disagree, and inspect the state just before that index. In a dynamic program, that index is a state; in a graph algorithm, it is a vertex or an edge. Print the state that the recurrence claims to hold and check it against the value the code actually has.

A wrong answer is a hypothesis, not a fact. You are told that the output is wrong and nothing about the input that made it wrong, so the work is entirely in shrinking the space of inputs.

### Runtime error

**What it looks like.** The program did not run to completion. The judge reports an error rather than a verdict, and the exit status is abnormal: a signal such as `SIGSEGV` or `SIGABRT` on a Unix judge, a nonzero exit code, or a message naming an exception type. The output file is usually empty or truncated.

**What causes it.** Almost always a memory error: an index outside the bounds of an array or a container, a null or dangling pointer, a use after free, a double free, or a recursion that exhausted the call stack. Also possible: a division by zero, an assertion that failed, or an unchecked conversion that produced an invalid value.

**The debugging path.** This is the friendliest of the three verdicts, because the program usually tells you where. Read the stack trace from the innermost frame outward, find the first frame in your own code, and look at that line. If the judge gives you no trace, reproduce locally with a sanitizer, which names the exact operation: `-fsanitize=address` for out-of-bounds accesses and use-after-free in C and C++, `-fsanitize=undefined` for signed overflow, misaligned access, and invalid shifts.

A runtime error is a location. It is still not a cause, because the line that crashed is often not the line that produced the bad value.

### Time limit exceeded

**What it looks like.** The program ran and was killed by the judge when it exceeded the time limit. There is no output, and the exit status is a timeout rather than a crash.

**What causes it.** The complexity is too high for the constraint. Frequently the algorithm is correct and quadratic when the constraint demanded linear, or the intended algorithm was used but implemented with a bad constant factor, or the input and output handling dominates because the data is large, or a container was used where an array was needed. Sometimes the program is not slow at all and the judge machine is simply slower than the laptop.

**The debugging path.** Do not look for a bug in the logic. Count the operations: instrument the code with a counter on the hot loop, or run the program on the largest legal input and time the phases separately. Then compare the count against the constraint. An $O(n^2)$ algorithm on $n = 2 \times 10^5$ performs about $4 \times 10^{10}$ operations, which does not fit in any time limit; an $O(n \log n)$ algorithm performs about $3.6 \times 10^6$, which is comfortable. If the complexity is right, the constant factor is wrong, and the profile says where.

### Telling them apart at a glance

| Verdict | The program | Where to look | The most common cause |
| --- | --- | --- | --- |
| Wrong answer | ran to completion | the first disagreeing output position | an off-by-one or an invalid transition |
| Runtime error | died before completing | the stack trace, the innermost frame | an out-of-bounds index or a null pointer |
| Time limit exceeded | ran and was killed | the operation count against the constraint | a missing optimization or a hidden quadratic |

The three verdicts also compose with one another in a way that wastes hours if you do not expect it. The same off-by-one that reads one element past the end of an array can produce a runtime error on one test and a perfectly plausible wrong answer on another, depending on what the memory happened to hold. And a recursion depth failure can be a runtime error in C++ and Java, a `RecursionError` in Python, and a time limit exceeded in a language with a large stack and a slow interpreter. The verdict describes the symptom on one machine, not the shape of the bug.

## The failure catalog

Twelve failures account for the large majority of the failed submissions in a contest. Each one has a recognizable shape, a usual cause, and a test that catches it. Learn the shapes: recognizing a failure from the symptom is most of the work of debugging.

| Failure | What it looks like | Usual cause | The test that catches it |
| --- | --- | --- | --- |
| Integer overflow | An answer that is a multiple of a power of two, or a negative number where a large positive one belongs | A product or sum computed in 32 bits before it was widened | A case whose answer is exactly $2^{31} - 1$ and one just past it |
| Off-by-one error | A correct answer on every input except the boundary | A loop condition of `<=` where `<` was meant, or a range of size $n - 1$ | The minimum legal input, with $n = 1$ |
| Mixing zero-based and one-based indexing | An answer that is right until two coordinate systems meet | A problem statement that numbers positions from one and a program that numbers them from zero | A two-element input, where the two conventions differ by exactly one |
| Uninitialized data | An answer that changes between runs on the same input | A local array or a struct field that was never written before it was read | Running the same input twice and comparing, and zeroing the memory between runs |
| Ignoring a disconnected graph | Nodes reachable only through a component the search never entered | A visited array that assumes every vertex has a path from the source | A graph with an isolated vertex and an isolated component |
| A broken priority queue comparator | Distances that come out in the wrong order, so a node is expanded too early | A comparator that compares the pair in the wrong order, or that returns a boolean instead of a strict weak ordering | A graph with several equal-weight shortest paths, where ties decide the order |
| A stale entry in a shortest-path search | Distances that are too large for exactly the vertices whose paths were improved after they were first reached | A vertex finalized when it was pushed rather than when it was popped | A graph where a vertex is first reached by a long path and later by a short one |
| An invalid dynamic-programming transition | A value that exceeds what the problem allows, or that double-counts an element | A transition that reuses an element that the problem requires to be used once | An input where the greedy order and the valid order disagree |
| Wrong binary search boundaries | An answer that is off by one, or a loop that never terminates | A half-open range written as a closed one, or a mid that rounds the wrong way | Searching for the first index satisfying a predicate at the first and last position |
| A recursion depth failure | A stack overflow, a `StackOverflowError`, or a `RecursionError` | A path-shaped input that forces a depth equal to the number of vertices | A path graph with as many vertices as the constraint allows |
| A floating-point precision failure | An answer that is correct to a few decimals and wrong in the last one | Accumulated rounding error, or a comparison of two values that should be equal | A case with repeated fractions, such as one tenth added ten times |
| A language-specific memory error | An error that appears in one language and not in another, or a crash on a large input only | In C, a missing free or a buffer of the wrong size; in Java, an object array versus an array of primitives; in Python, a recursive default argument | The largest legal input, run with the sanitizer for the language |

## The method: reproduce, minimize, bisect

This is the sequence. It is not advice to follow when convenient; it is a procedure, and skipping a step makes the next one harder.

### Step one: reproduce

Get four things pinned down: the exact input, the exact command that runs your program on it, the exact output your program produced, and the exact expected output. Write them down. If the failure does not happen on your machine when you run that command with that input, you do not have a bug you can debug yet; you have a bug you have not reproduced, and everything after this step is guesswork.

Reproduction also means getting the environment right. Use the same compiler, the same flags, and the same standard library version as the judge, because a program that fails only under a different compiler is a program with a portability bug and a program that fails only with different flags is a program with an undefined-behavior bug. If the failure is a runtime error, build with a sanitizer. If the failure is a wrong answer, confirm that your local expected output is the judge's expected output and not your own guess at it.

### Step two: minimize

Now shrink the input while preserving the failure. The smallest failing input is usually three elements long, and it is usually obvious once you see it.

Two techniques do most of the work. **Delta debugging** removes chunks: delete a contiguous block of the input, run the program, and if it still fails, keep the deletion. Halve the block size and repeat. **Simplification** replaces parts of the input with smaller or simpler values: replace a run of random numbers with zeros, replace a large number with one, replace a graph with a path, and keep each replacement only if the failure survives.

Minimization has a payoff beyond a smaller input. A minimal input makes the difference between two candidate causes visible, because with three elements there are few enough cases to enumerate by hand. And a minimal input is a **counterexample**, which is a reusable artifact: it belongs in your own test set forever.

### Step three: bisect

Bisecting means halving a search space by choosing the middle. It applies to three different spaces.

**Bisect the input.** If the program processes an array left to right, find the first prefix that triggers the failure by testing prefixes of length $1, 2, 4, 8, \ldots$ and then narrowing. The last prefix that works and the first one that fails differ by one element, and that element is the culprit.

**Bisect the code.** If the program once worked and now does not, `git bisect` finds the commit that broke it in about $\log_2 n$ steps, where $n$ is the number of commits in the range. This is the single most underused debugging tool in competitive programming, because people reimplement from scratch instead of finding the one line that changed.

**Bisect the stages.** When you cannot bisect the input, insert a checkpoint between the stages of the algorithm and print the state at each one. The last checkpoint whose state is correct and the first whose state is wrong localize the bug to one transition. This is the practical form of the technique for algorithms whose state is too large to bisect by input.

### A worked example of the three steps

The program computes the maximum sum of a contiguous subarray of an array of $n$ integers, with $n \ge 1$. It is the standard linear scan, and it is used here because the failure it suffers from is small enough to see.

**The symptom.** On the judge, the program dies with a runtime error on one test case out of twelve: a segmentation fault, with no line number in the judge's report. The other eleven test cases pass, which is the detail that makes the failure interesting.

**Reproduce.** The failing input is copied verbatim from the judge output, and the program is compiled with the same flags as the judge. On the laptop it crashes the same way, every time. The failure is reproduced, so it is a property of the program and not of the environment.

**Localize.** The program is rebuilt with `-fsanitize=address`, which turns the silent out-of-bounds access into a named one. The report says `heap-buffer-overflow`, names the read of four bytes, and gives the line: the statement that accumulates the running sum, reading `a[i]`. The line is inside a loop, so the question becomes which value of `i` is wrong.

**Minimize.** The failing input is reduced by deletion and simplification. The failing test is a single case with $n = 5$ and the array $[3, -1, 4, -2, 5]$, and the sanitizer fires on every one of them, because the read happens on every run and not only on some inputs. Replacing every element with $1$ still fires it, which says the values are irrelevant and the loop bound is the fault. The smallest failing instance is $n = 1$ with the array $[1]$.

**Bisect.** With $n = 1$ the program reads $a[0]$ and then reads $a[1]$, which is one element past the end of a one-element vector. Reading the loop shows the condition `for (i = 0; i <= n; i++)`, so the index reaches $n$ and the array ends at $n - 1$. The condition should be `i < n`.

**The diagnosis.** The loop reads one element past the end of the array. On the judge's memory layout that read lands in unpredictable memory, so the same bug produced a runtime error on one test and a plausible wrong answer on another, where a small stray value left the running sum unchanged and a large one inflated it. The verdict you receive depends on the machine, not on the shape of the bug.

**The fix.** The condition becomes `i < n`. The minimized instance now prints $1$, the original instance prints $9$, and all twelve judge tests pass.

**The regression.** The minimized instance $[1]$ and the original instance $[3, -1, 4, -2, 5]$ join the local test set, so this exact bug cannot come back.

## Differential testing

Differential testing is the strongest tool in this laboratory, because it is the only one that can find a bug you did not think to look for.

### The formal statement

Let $A$ be the implementation you want to trust, usually the fast one. Let $B$ be a reference implementation that you believe correct, usually the slow and obviously correct one. Both are functions from the input space $\mathcal{I}$ to the output space $\mathcal{O}$. Let $X \subseteq \mathcal{I}$ be the set of test inputs you generate.

::: math definition Differential testing
For every $x \in X$, check that $A(x) = B(x)$. The test passes when no input in $X$ produces a disagreement.
:::

The property you actually want is the universal statement

$$
\forall x \in \mathcal{I},\quad A(x) = B(x),
$$

and the test checks the restricted statement

$$
\forall x \in X \subseteq \mathcal{I},\quad A(x) = B(x).
$$

### What a disagreement proves, and what agreement does not

**A disagreement is a counterexample.** If there is an $x \in X$ with $A(x) \ne B(x)$, then the claim that $A$ agrees with $B$ everywhere is false, and $x$ is a specific witness. One counterexample settles the question of whether the implementations agree. The remaining work is to decide which of the two is wrong, and a disagreement always forces that decision, which is a good property for a test to have.

**Agreement is not a proof.** If no input in $X$ produces a disagreement, then all you know is that the two implementations agree on the inputs you tried. The input space is generally infinite, and the untested part of it is untouched. $X$ might be ten random instances or ten million; neither number turns the restricted statement into the universal one. The only thing that closes the gap is an argument: a proof that the two implementations compute the same function, by induction, by an invariant, or by a case analysis.

This is the honest framing. Differential testing finds bugs; it does not certify correctness. A test suite that has never failed proves nothing except that the implementation has not been broken in the ways the suite exercises.

### The value of a fixed random seed

A randomized generator is the cheapest way to build a large $X$, but a random test that cannot be repeated is barely a test.

**A fixed seed makes the test set reproducible.** If the generator is seeded with a constant, then the same sequence of inputs is produced on every run, on every machine, for every developer working on the code. When the test fails at input $x$, $x$ can be regenerated exactly, printed, and reduced to a minimal counterexample.

**A fixed seed makes a fix verifiable.** After changing $A$, you re-run the same suite. If the suite now passes, you know the fix works on the same inputs that exposed the bug, and you know you did not merely trade one failure for another.

**A fixed seed makes the suite auditable.** Anyone can reproduce the exact $X$ the suite covers and reason about what it does and does not exercise. A seed chosen once, recorded in the source, and occasionally changed when the generator improves is the practice.

Two practical rules follow. Record the seed in the code, next to the generator, as a named constant rather than a magic number. And when a failure is found, add the minimized counterexample to a separate deterministic set that always runs, so the regression survives a change of seed.

### The reference must be trustworthy

Differential testing is only as good as $B$. If $B$ is also wrong, the test can still detect a disagreement, but it cannot tell you which implementation is at fault, and a wrong $B$ that agrees with a wrong $A$ is invisible forever.

The reference should therefore be written to be obviously correct rather than fast: a brute force over all possibilities, a direct transcription of the problem statement, an $O(n^2)$ scan where the real implementation is $O(n \log n)$. Slowness is a feature in a reference. It should also be written independently, from the statement and not from the optimized code, so that a mistake in the derivation is not copied into both.

A useful complement is a **metamorphic relation**: a property that holds between two related inputs even when no expected output is known. For a program whose answer should not depend on the order of the input, generate a permutation and check that the answer is unchanged. For a program that should satisfy a bound, check the bound on every generated output. These tests need no reference implementation at all, which makes them a good second line of defense.

## Constructing adversarial inputs

Random testing finds the ordinary bugs. The bugs that survive random testing are the ones that need an input built on purpose. Every problem has a handful of inputs that break it, and the constructions below are the ones that produce them.

**The maximum instance.** Take the largest $n$ the constraints allow and the largest values each element may take. This is the input that finds overflow, that finds the accidental quadratic, and that finds the array that does not fit in memory. Never wait for the judge to supply it.

**The minimum instance.** The smallest legal input is usually $n = 1$, and it is the input that finds the loop that never runs, the maximum over an empty set, the pair that does not exist, and the division by a count of zero. If the statement allows an empty input, that is the minimum too.

**Duplicates.** Every element equal. Every element equal except one. Two adjacent equal elements. A value repeated so many times that a hash set, a sort, or a map degenerates.

**Negatives and zeros.** All elements negative, when the constraints allow it. All elements zero. The single smallest negative value, which is where the sign of an answer flips. A run of zeros at the start, at the end, and in the middle, because a two-pointer or a sliding window breaks at the ends before it breaks in the middle.

**The boundaries of every range.** For every constraint in the statement, take the lower bound, the upper bound, and one past the upper bound. For every value range, take the minimum, the maximum, and the first value that changes the answer. If the answer is a count, test the input where the count is exactly $2^{31} - 1$.

**A pathological graph shape.** A path, because it forces the deepest recursion and the longest shortest path. A star, because it is shallow and wide. A complete bipartite graph, because it is dense. A graph with two components, because it finds the assumption that everything is connected. A graph with many equal-weight edges, because it makes tie-breaking decide the output. A graph where one vertex has a very large degree, because it finds an $O(\deg^2)$ scan.

**A repeated operation.** Apply the same operation many times: the same union on the same set, the same query repeated, the same edge inserted twice, the same number added many times. Repetition finds idempotence assumptions and accumulation errors, and it is how an off-by-one in a difference array shows up.

## Reading a stack trace

A stack trace is a list of frames, printed innermost first. The frame at the top is the call that was running when the failure happened; each frame below it is the function that made the call above it; the bottom frame is where the program started. Read it in that order, and read it for a specific purpose.

**1. Read the exception type first.** It names the class of failure before you look at any code. A null pointer exception, an index out of bounds, a division by zero, and a stack overflow each send you to a different place.

**2. Read the first frame.** This is the line where the fault was detected. In Java and Python it is where the exception was raised, which is often not where the bad value came from. An `IndexOutOfBoundsException` raised inside a library means the library was handed a bad index; the interesting frame is the one in your code that called it.

**3. Walk down to the first frame in your own code.** Frames inside the runtime, the standard library, or the test framework carry no information about your bug. The first frame that names your file is the first place you own.

**4. Keep walking down to find where the bad value entered.** The fault is where the program died; the cause is where the value was born. A trace of ten frames where the first of yours is at line 200 and a later one is at line 40 usually means a bad value was produced at line 40 and carried to line 200 without being checked. Both lines matter, and the earlier one is the bug.

**5. Check the frames you think are irrelevant.** Two common traps. An exception thrown inside a callback or a comparator is reported at the call site of the sort, not at the comparator, so the trace points at the sort and the bug is in the comparison function. And a stack that overflows reports a crash in the deepest recursive call, which is a symptom of the recursion strategy rather than a bug in that line.

**6. Read the frames from the top down, but reason about them from the bottom up.** The bottom frame is where execution began, and each frame above it is a call made from the frame below it. When you describe the bug to someone else, describe it in call order: the entry point called this, which called this, which failed here.

## A mistake in the idea, or a mistake in the code

These two have opposite remedies. A mistake in the code is fixed by finding the line. A mistake in the idea is fixed by finding a better idea, and no amount of careful reading of the code will produce one.

**A mistake in the idea** means the algorithm is wrong. The greedy choice is not safe, the dynamic-programming state does not carry enough information, the proof has a hole, or the algorithm computes the wrong quantity. The symptom is that a correct implementation of that idea would fail in exactly the same way.

**A mistake in the code** means the algorithm is right and the program does not do what the algorithm says. The symptom is that a correct implementation of the same idea succeeds on the same input.

Three tests separate them.

**Test one: the naive comparison.** Write the simplest correct implementation of the idea, a brute force that follows the statement literally, and run both on the failing input. If the brute force gets the right answer and your fast implementation does not, the idea is probably right and the code is wrong. If the brute force also gets it wrong, the idea is wrong, or the brute force is wrong. When the brute force is too slow for the failing input, shrink the input until it is not, which is the minimization step again.

**Test two: the structural signature.** Look at the shape of the failing input. A failure that appears on inputs with a recognizable structure, such as a tie, a zero, a negative, two equal elements, or a graph with exactly one bridge, is usually an implementation bug: the code mishandles a boundary or a tie that the idea handles. A failure that appears on large inputs and produces an answer that is wildly wrong, rather than off by one, is usually an idea bug: the algorithm computes the wrong quantity. This test is a heuristic, not a proof, but it is fast and it is right most of the time.

**Test three: the clean rewrite.** Re-implement the same idea from scratch, carefully, without looking at the old code. If the rewrite passes, the first version had an implementation bug. If the rewrite fails in the same way, the idea is wrong. This is the most expensive test and it is worth it only when the first two are ambiguous.

A fourth signal is the shape of the wrong answer. If the answer is off by a small amount, or is right for a whole class of inputs and wrong only at a boundary, think implementation. If the answer is plausible-looking but structurally wrong, such as a shortest path that is longer than the true one, think idea.

## A worked debugging session

Here is a session from the symptom to the fix, with every intermediate step written out.

**The problem.** A weighted undirected graph with $n$ cities and $m$ roads. Read a source city, and for every city print the length of the shortest route from the source. The intended solution is Dijkstra's algorithm with a binary heap, and the reference implementation for the problem is a Bellman-Ford.

**The symptom.** Wrong answer on two of the twelve judge test cases. The judge reports the first disagreeing line, and the distance your program prints for some cities is larger than the expected distance. It is never smaller. The other ten test cases pass.

**Step one, reproduce.** The failing input is copied from the judge output and run locally. The same wrong distances appear, with the same values. The failure is reproduced, so it is a property of the program and not of the environment.

**Step two, localize.** Since the distances are too large and never too small, the bug cannot be in the relaxation comparison; a comparison error would produce distances that are too small. Add two counters: one for the number of times each vertex is marked as seen, and one for the number of times each vertex is expanded. The counts expose the contradiction. One vertex is marked seen but its recorded distance is larger than the shortest route to it, and every vertex behind it is too large by exactly the same difference. A vertex is supposed to be expanded once, with its final distance. Here it was expanded with the first estimate and never again.

**Step three, minimize.** The failing graph is reduced by the constructions above. Deleting a vertex that lies on no route from the source to the interesting pair changes nothing. Deleting the path through $q$ makes the failure disappear, and so does deleting the path through $p$, so both routes are needed. The smallest failing graph found has five vertices and five edges: a source $s$, two intermediate vertices $p$ and $q$, a vertex $v$ that both routes reach, and a vertex $w$ behind $v$.

- $s$ to $p$ has weight 1, and $p$ to $v$ has weight 10.
- $s$ to $q$ has weight 2, and $q$ to $v$ has weight 3.
- $v$ to $w$ has weight 1.

The true distance to $v$ is 5, through $q$, and the true distance to $w$ is 6.

**Step four, bisect the stages.** A checkpoint is inserted between the stages of the loop: the pop of a vertex from the queue, the relaxation of its edges, and the marking of a vertex as seen. The queue is in the right order, and the arithmetic of the relaxation is right, because the guard in the relaxation discards the improvement rather than the comparison that computes it. The checkpoint that shows the contradiction is the third one: a vertex is marked as seen at the moment it is pushed into the queue, and the distance recorded at that moment is a first estimate that is never replaced.

**Step five, read the code against the algorithm.** The algorithm says: a vertex is finalized when it is removed from the queue, because at that moment its distance is the smallest in the queue and therefore final. The code says:

```cpp
for (auto [v, w] : adj[u]) {
    if (seen[v]) continue;        // v was "finalized" when it was discovered
    if (d + w < dist[v]) {
        dist[v] = d + w;
        seen[v] = true;           // finalized here, on discovery
        pq.push({dist[v], v});
    }
}
```

The vertex is marked finalized at the moment it is discovered, not when it is removed from the queue. At that moment its distance is a first estimate, not a final one, and the guard on the first line then refuses to improve it ever again.

**Step six, the counterexample.** On the minimal graph, the queue pops $s$ first and relaxes its two edges, so $p$ is reached with distance 1 and $q$ with distance 2. The queue pops $p$ next, and $p$ relaxes the edge of weight 10, so $v$ is discovered with distance 11, marked as seen, and pushed. The queue then pops $q$, and $q$ relaxes the edge of weight 3, which would give $v$ the distance 5. The guard `if (seen[v]) continue;` throws that improvement away, because $v$ was marked when it was first pushed. So $v$ keeps the distance 11, is expanded with it, and $w$ is reported as 12 instead of 6.

::: math counterexample Counterexample
On the graph $s \to p \to v \to w$ with weights 1, 10, 1 and $s \to q \to v$ with weights 2 and 3, the true distance to $v$ is 5 and to $w$ is 6. The code finalizes $v$ on discovery with distance 11 and never improves it, so the reported distances are 11 and 12.
:::

**Step seven, the fix.** Finalize a vertex when it is removed from the queue, and discard the stale entries:

```cpp
auto [d, u] = pq.top();
pq.pop();
if (d > dist[u]) continue;   // a stale entry from an earlier estimate
for (auto [v, w] : adj[u]) {
    if (d + w < dist[v]) {
        dist[v] = d + w;
        pq.push({dist[v], v});
    }
}
```

The `seen` array is then unnecessary, because the comparison against the current distance already discards the stale entries, and the answer is read from `dist` for every vertex.

**Step eight, verify.** The minimal counterexample now reports 5 and 6. The original failing input passes. The other ten judge tests still pass. And a differential test against the Bellman-Ford reference on 2000 random graphs, with a fixed seed, finds no disagreement, and a second run with a different seed finds none either.

**Step nine, prevent recurrence.** The minimal graph is added to the local test set. The lesson is recorded in the failure catalog above as a stale entry in a shortest-path search, and the question it raises is added to the review checklist: does every vertex get finalized exactly once, at the moment its distance becomes final?

## Review checklist

Work through this list after every failed submission and before every contest. Each item names the section above that answers it.

1. Have I recorded the exact input, command, output, and expected output? (Reproduce)
2. Can I reproduce the failure on my own machine, with the judge's compiler and flags?
3. Have I built with a sanitizer, so a memory error becomes a located error? (Runtime error)
4. Have I minimized the failing input to the smallest case that still fails? (Minimize)
5. Do I have a counterexample I can keep as a permanent regression test?
6. Have I counted the operations and compared them with the constraint? (Time limit exceeded)
7. Have I written the simplest correct implementation and compared it against mine? (Idea or code)
8. Do I have a reference implementation to compare against, and a fixed random seed to generate the inputs?
9. Have I checked the maximum instance, the minimum instance, duplicates, negatives, and the boundaries of every range? (Adversarial inputs)
10. Have I read the stack trace from the innermost frame outward and found the frame where the bad value entered?
11. Have I checked the places where an integer could overflow, an array could be read past its end, or a vertex could be finalized twice?
12. Have I confirmed that the finalization, the tie-breaking, and the index bases are the ones the algorithm assumes?

Before the clock starts, work through the [pre-contest checklist](/reference/contest-checklist). It carries the same failures in the form of checks to perform in advance, because a bug that a checklist can prevent is cheaper than a bug that a debugging session has to find.
