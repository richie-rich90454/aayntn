---
id: start.contest-literacy
title: Contest problem-solving literacy
summary: Reading a specification, building a baseline, proving a solution, and debugging under time pressure.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [debugging, brute force, counterexample, differential testing, proof]
prerequisites:
    required: [start.algorithm-analysis]
    recommended: [start.computational-foundations]
reviewed: false
---

Parts 1 through 5 gave you the machine, the ruler, the mathematics, the vocabulary, and the languages. Part 6 is the craft. It is the part that decides how much of the other five you actually convert into points while a clock is running.

The ten modules below are about process rather than content. They cover reading a specification closely enough to program it, building a slow program you are sure is right, replacing it with a fast one that is still right, finding the input that breaks it, and explaining why it cannot be broken. The last three modules are about the part of the contest that no algorithm article covers: deciding what to do with the time you have left.

The claim this part rests on is simple. **Almost every contest failure is a failure of reasoning about the problem, not a failure to know an algorithm.** A competitor who knows forty techniques and cannot read a specification will score below a competitor who knows eight and can. The skills here are learnable, and they are the ones that separate a bronze medal from a silver medal far more reliably than knowing another data structure.

<Synonyms terms="contest strategy, debugging, brute force, counterexample, differential testing, proof writing, time management" />

## 6.1 Reading a formal input and output specification

A contest statement is a contract, not a story. It has an input format, an output format, a set of guarantees about the data, and a question. Everything else in the statement is illustration. A statement that spends three paragraphs on a story and one paragraph on the input format is telling you where the precision is.

**What it is.** Extracting four things from a statement before you write any code:

1. The **input format**: what tokens appear, in what order, and what each one means.
2. The **output format**: how many values to print, in what order, separated by what.
3. The **guarantees**: what the data will always satisfy, which is what lets you skip defensive checks.
4. The **question**: the exact quantity requested, including every qualifier.

**Why it matters.** The qualifier is where the points are. "Print the largest sum of a contiguous subarray" and "print the largest sum of a contiguous subarray of length at least $k$" are different problems. "Print any pair whose sum is $s$" and "print the pair with the smallest first element whose sum is $s$" are different problems, and the second one has a checker that only accepts one particular answer family. Reading carefully costs two minutes. Getting it wrong costs the whole problem.

**Worked example.** Consider this specification fragment:

> The first line contains a single integer $N$, the number of readings ($1 \le N \le 10^5$). The second line contains $N$ integers, the temperature at each hour, each between $-100$ and $100$. Print a single integer, the largest difference between the temperature at any two hours, where the later hour has the higher temperature.

Write the contract in your own words before coding:

- Input: one integer $N$, then $N$ integers. The integers may be split across lines arbitrarily; read tokens, not lines.
- Output: exactly one integer, followed by a newline.
- Guaranteed: $N \ge 1$. If $N = 1$, no pair exists, and the problem must therefore define the answer in that case. Read again: the statement says the later hour has the _higher_ temperature, so with $N = 1$ there is no valid pair at all, which means the statement is incomplete unless it excludes $N = 1$ or defines an answer of $0$.

That last sentence is the whole exercise. A reader who notices the gap will ask for a clarification or will test the $N = 1$ case explicitly. A reader who does not will ship a program that prints a sentinel on the smallest test case.

The most common format traps are these:

| Trap | What the statement actually says | What your program must do |
| --- | --- | --- |
| Line structure is not guaranteed | "The next line contains $N$ integers" | Read $N$ tokens regardless of line breaks |
| The first value is a count | "The first line contains $N$, the number of ..." | Read it, then read exactly $N$ more values |
| There are several test cases | "The first line contains $T$" | Loop $T$ times, and note that some problems use $T$ for a different quantity |
| Any valid answer is accepted | "Print any such pair" | The checker accepts several answers; do not assume uniqueness |
| A unique answer is required | "Print the smallest such index" | Your output must be the specified one, not merely a valid one |
| A float is requested | "Print the answer" with a real quantity | Match the format the checker expects, including the number of decimal places |

**What you must get right.** Rewrite the specification in your own words in two or three lines before you write any code, and include the answer for the smallest legal input in that rewrite. A program that has never been asked what it should print for $N = 1$ will not answer it correctly.

### Checkpoint

**Conceptual.**

1. What four things must you extract from a contest statement before writing any code, and why is each of them different in kind from the rest of the statement?
2. Why does a specification that says "the next line contains $N$ integers" permit an input in which those integers are spread over several lines? What does that force your reader to do differently from a line-oriented reader?
3. Explain the difference between "print any pair whose sum is $s$" and "print the lexicographically smallest pair whose sum is $s$", and say what happens if you submit the first program to the second problem.

**Code reading.**

1. This reader assumes one value per line. Say which legal input breaks it, and rewrite it to read tokens instead:

    ```cpp
    int n;
    std::cin >> n;
    int total = 0;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        total += x;
    }
    std::cout << total << '\n';
    ```

2. This program prints the answer for a problem that asks for "the largest value", but it prints nothing when the array is empty. Say what the missing case is, what the judge would report, and where the fix belongs:

    ```cpp
    int best = 0;
    for (int x : values) best = std::max(best, x);
    std::cout << best << '\n';
    ```

**Implementation.** Write a program that reads a whitespace-separated sequence of integers of unknown length until end of input and prints their sum and their count. Then write a second program that reads the same data but assumes one value per line and reports how many values it read. Feed the second program an input in which a single line holds three values, and explain the failure in one sentence.

**Applied problem.** A problem says: "Print the smallest index $i$ such that $a_i > a_j$ for some $j < i$, or $-1$ if no such index exists." Write the input and output contract in your own words, including what must be printed when $N = 1$ and when the array is strictly increasing.

## 6.2 Constraints, hidden edge cases and the boundary of the input space

The constraints in a statement are not decoration. They are the definition of the legal input space, and the edge cases are the corners of that space. A solution is correct only if it is correct at the corners.

**What it is.** Reading the constraints to answer two questions: how large can the input be, and how small can it be. The first question bounds your complexity requirement; the second question produces the degenerate cases that break code written for the middle.

**Why it matters.** Two failures follow directly from ignoring this. First, you choose an algorithm that cannot finish, and you discover this when the judge says time limit exceeded, at which point the contest is half over. Second, you write code that assumes $n$ is large, or that assumes the data is interesting, and it fails on the one test case designed to catch exactly that.

**The edge cases that recur.** Learn this list once; it covers most of what contest tests actually check.

| Edge case | Why it breaks code |
| --- | --- |
| $n = 1$ | The loop runs once; there is no pair, no second element, no comparison |
| $n = 0$, if allowed | The array is empty; every "maximum" is over an empty set |
| All values equal | Strict and non-strict comparisons behave differently; ties are everywhere |
| All values distinct | Tie-breaking code is never exercised, and may be wrong |
| Already sorted, and reverse sorted | Some algorithms are correct only on one of them |
| One value far out of range | Sorting and partitioning hit the boundary |
| A single repeated value dominates | Mean-based and median-based reasoning diverge |
| The maximum possible value | Overflow occurs exactly here and nowhere else |
| A graph that is one long chain | Recursion depth equals the number of vertices |
| A graph that is one big star | The queue in a breadth-first search holds almost everything |
| A graph with no edges | Connectivity questions have a different shape |
| Two equal keys in a sorted structure | Tie-breaking decides the answer |

**The number matters.** Constraints are usually given as a power of ten, and the power of ten selects the complexity class you can afford.

- $n \le 10^3$: $O(n^2)$ is about $10^6$ operations, which is fine.
- $n \le 10^5$: $O(n^2)$ is about $10^{10}$ operations, which is not fine. You need $O(n \log n)$.
- $n \le 10^6$: $O(n \log n)$ is about $2 \times 10^7$ operations, which is fine, but $O(n \log^2 n)$ is marginal and the constant factor starts to matter.
- $n \le 10^9$: $n$ does not fit in memory as an array of anything but bits. The problem must have a different structure, usually an arithmetic or logarithmic one.

**Worked example.** A problem gives $N \le 2 \times 10^5$ and asks for the number of pairs $i < j$ with $a_i < a_j$. The double loop costs about $2 \times 10^{10}$ operations and cannot work. A Fenwick tree over the value coordinates answers it in $O(N \log N)$.

Now the edge cases for that problem. If $N = 1$, the answer is $0$. If all values are equal, the answer is $0$, because the comparison is strict. If the comparison were $a_i \le a_j$ instead, all-equal would give $\frac{n(n-1)}{2}$, which is $2 \times 10^{10}$ and does not fit in a 32-bit integer, so the answer must be stored in a 64-bit type. The single character of the comparison changes both the edge case and the storage width.

**What you must get right.** Before writing code, write down the largest legal input and the smallest legal input, and check that your solution handles both. And compute the memory: a `std::vector<int>` of $10^6$ elements is 4 MB, a `std::vector<long long>` is 8 MB, and a Python list of $10^6$ small integers is roughly 8 MB of pointers plus the objects. The memory limit is a constraint too.

### Checkpoint

**Conceptual.**

1. Why does the statement of a problem specify both a maximum and a minimum for the input size? What class of bug does the minimum catch that the maximum cannot?
2. Given $n \le 3 \times 10^5$, state which of $O(n)$, $O(n \log n)$ and $O(n^2)$ are affordable, and justify the boundary with the operation counts.
3. Give one problem where the strictness of a comparison, and not the size of the input, determines the required storage width of the answer.

**Code reading.**

1. This code computes the maximum subarray sum by Kadane's algorithm. It is correct for every input except one shape. Say which shape, and give the fix:

    ```cpp
    long long best = 0, cur = 0;
    for (int x : a) { cur = std::max(0LL, cur + x); best = std::max(best, cur); }
    ```

2. This code is meant to find the second-largest distinct element. Say what it computes instead, and under what condition the difference appears:

    ```cpp
    long long first = LLONG_MIN, second = LLONG_MIN;
    for (long long x : v) {
        if (x > first) { second = first; first = x; }
        else if (x > second) { second = x; }
    }
    ```

**Implementation.** For each of the following, write the smallest input that exercises the degenerate case, and state the answer your program must print: (a) the maximum of an array whose length is at most one; (b) the number of inversions of an array of length one; (c) the sum of the maximum subarray of an array whose length is at most one.

**Applied problem.** A problem asks for the number of connected components of a graph with $n$ vertices and $m$ edges, where $0 \le n \le 10^5$ and $0 \le m \le 10^5$. List every degenerate input shape the judge might use, and say what the answer is for each.

## 6.3 Building a correct brute-force baseline

**What it is.** A deliberately slow program that computes the right answer. It is written in the simplest way that could possibly be correct: no clever data structures, no asymptotic ambition, one obvious loop for each requirement in the specification.

**Why it matters.** Three reasons, in increasing order of value.

1. It forces you to finish reading the specification. You cannot write a brute force until you know what the answer is.
2. It gets you a partial score. If the brute force is fast enough for some of the test cases, the judge gives you credit for those, and a partial score is a real score.
3. It becomes the **reference implementation** for differential testing. This is the reason the discipline exists, and it is covered in module 6.7.

The third reason dominates. A contest is full of problems where you can write the slow version but not the fast one, and where you should therefore spend the time on the slow version. If you have a correct slow version, you have a way to know whether your fast version is also correct, and you have something to submit if the fast version runs out of time.

**The rule.** The baseline is written to be obviously correct, not to be fast. If you find yourself choosing between two ways to write the baseline, take the one that a reader can verify by reading. No data structures. No clever loops. One variable per quantity in the specification.

**Worked example.** Consider: given $n$ numbers, find the maximum sum of a contiguous subarray.

The brute force enumerates all contiguous subarrays. For each starting index $i$, extend the end index $j$ and keep a running sum:

```cpp
long long best = LLONG_MIN;
for (int i = 0; i < n; ++i) {
    long long sum = 0;
    for (int j = i; j < n; ++j) {
        sum += a[j];
        best = std::max(best, sum);
    }
}
```

This is $O(n^2)$ time and $O(1)$ extra space. It is correct by inspection: every contiguous subarray is a pair $(i, j)$ with $i \le j$, the outer loop enumerates every $i$, the inner loop enumerates every $j \ge i$, and `sum` is the sum of exactly that subarray. The initialization of `best` to `LLONG_MIN` rather than $0$ matters, because the answer may be negative: an array of all negative numbers has a maximum subarray sum equal to its largest element, not $0$. Using $0$ as the initial value is the classic baseline bug, and it is exactly the kind of bug the brute force is supposed to catch in the fast version.

**What you must get right.** Write the baseline, test it on the examples, and read it once more for the degenerate case, before you write anything faster. A baseline that has never been executed is not a reference implementation; it is a second implementation with an independent chance of being wrong.

### Checkpoint

**Conceptual.**

1. Give the three reasons a brute-force baseline is worth writing even when you are certain you know the fast algorithm.
2. Why is the brute force used as a reference implementation in differential testing only trustworthy if it was executed at least once? What goes wrong if it was not?
3. Why must the baseline avoid data structures? Give a concrete example of a bug that a data structure can hide and a plain loop cannot.

**Code reading.**

1. This baseline enumerates all pairs of indices. Say which inputs it computes correctly, and what it returns for an input of length one:

    ```cpp
    int best = 0;
    for (int i = 0; i < n; ++i)
        for (int j = i + 1; j < n; ++j)
            best = std::max(best, a[i] + a[j]);
    ```

2. This baseline is supposed to count the subsequences of the input that are strictly increasing. Say what it counts instead:

    ```cpp
    int count = 0;
    for (int i = 0; i < n; ++i)
        for (int j = i; j < n; ++j) {
            bool ok = true;
            for (int k = i + 1; k <= j; ++k)
                if (a[k] <= a[k - 1]) ok = false;
            if (ok) count++;
        }
    ```

**Implementation.** Write a brute-force program that counts the number of pairs $(i, j)$ with $i < j$ and $a_i < a_j$, using two nested loops and no other structure. Then write a version that counts the same thing using a Fenwick tree, and check that the two agree on every array of length at most eight with values in $\{0, 1, 2\}$. Report the number of arrays you tested and the total number of comparisons the second version performs.

**Applied problem.** A problem asks for the number of triples $(i, j, k)$ with $i < j < k$ and $a_i + a_j + a_k = 0$, where $n \le 2000$. Write the $O(n^3)$ baseline. Then say, in one sentence, what changes about the algorithm when $n$ becomes $2 \times 10^5$, and which structure would carry the change.

## 6.4 Optimizing without losing correctness

**What it is.** Replacing an algorithm by a faster one while keeping the observable behavior identical. The behavior is not just the final answer: it is the answer, the output format, and the values printed.

**Why it matters.** Optimization without a correctness criterion is how a correct program becomes an incorrect one. Every time you replace a piece of logic, you are asserting that the new piece computes the same thing as the old one on every legal input. A differential test checks that assertion on the inputs you tried; a proof checks it on all of them.

**Two different kinds of optimization.** Keep them apart, because they have different risk profiles.

- **Constant-factor optimization** changes how fast the program computes the same function. Swapping `std::endl` for `'\n'`, using `int` instead of `long long` when the range allows, or avoiding a copy in a loop. The output is unchanged, always. These are safe, and they are worth doing.
- **Algorithmic optimization** changes what is computed. Replacing a nested loop with a Fenwick tree, or a linear scan with a binary search. The output is unchanged only if the replacement is genuinely equivalent, and that is a mathematical claim that needs an argument.

**The three rules that keep an optimization honest.**

1. **Keep the baseline.** Do not delete the slow version when the fast one works. Keep it in a separate file, and keep the harness that compares them.
2. **Change one thing at a time.** If you change the algorithm and the input method in the same edit, a failure does not tell you which change caused it.
3. **Compare on the same input.** The two programs must see byte-identical input, and their outputs must be compared exactly, including the formatting.

**Worked example.** The pair-counting baseline from module 6.3 counts pairs with $a_i < a_j$. The fast version uses a Fenwick tree: sweep $j$ from left to right, and for each $j$ ask the tree how many of the values already seen are strictly less than $a_j$.

The equivalence claim has one subtlety that is easy to miss. The Fenwick tree as usually written answers "how many values are at most $x$". The problem asks for "strictly less than". These differ by exactly the number of occurrences of $a_j$ itself among the earlier values. So the fast version must query $a_j - 1$, not $a_j$, when the values are integers in a bounded range. This is the single most common bug in this exact transformation, and it is invisible on random data where duplicates are rare, and fatal on a test where every value is equal.

That is why the comparison must be exact and the test set must include duplicated values.

**What you must get right.** Every algorithmic replacement comes with a one-sentence statement of why it computes the same thing, and the answer to that sentence is checked against a test that includes the awkward cases: duplicates, extremes, and the smallest input.

### Checkpoint

**Conceptual.**

1. What is the difference between a constant-factor optimization and an algorithmic optimization, and why does only one of them need a correctness argument?
2. Why is "change one thing at a time" more important during optimization than during ordinary development?
3. Give a case where two functions agree on every random input you could generate but disagree on a legal input, and say what kind of test finds it.

**Code reading.**

1. This fast version is supposed to count pairs with $a_i < a_j$, matching the baseline from module 6.3. Say precisely what it counts instead, and construct an input on which the two disagree:

    ```cpp
    Fenwick fw(MAXV);
    long long ans = 0;
    for (int x : a) { ans += fw.query(x); fw.add(x, 1); }
    ```

2. This loop was changed from `std::endl` to `'\n'`. Say what the change does to the output, and what it does to the runtime:

    ```cpp
    for (int x : v) std::cout << x << std::endl;
    ```

**Implementation.** Write the pair-counting baseline and the Fenwick tree version, and a program that generates every array of length at most seven over the alphabet $\{0, 1, 2\}$, runs both versions on each, and reports the first disagreement. Confirm that the pair count uses a strict comparison on both sides.

**Applied problem.** A problem asks for the number of pairs $i < j$ with $a_i \le a_j$, and the constraint allows all values to be equal. Say exactly which line of the fast version from the worked example must change, and what the resulting answer is for an array of $10^5$ equal values.

## 6.5 Producing counterexamples

**What it is.** A counterexample is a specific input on which a program produces the wrong answer. Its purpose is to make a failure concrete enough to reason about. A failure report of the form "wrong answer on test 14" is useless; a counterexample of four numbers is a problem you can solve.

**Why it matters.** Contest debugging is a search through an enormous space of inputs, and you have minutes. The standard technique is to shrink the failing input until it is too small to hide anything, and then the bug is usually visible on sight. This is sometimes called delta debugging, and it is the single highest-value habit in this module.

**The shrinking procedure.** Given a failing input $x$, produce a smaller failing input $x'$:

1. **Remove parts.** Delete an element, a line, a vertex, an edge. If the program still fails, keep the deletion. Repeat. This reduces the problem to the smallest number of objects that still triggers the bug.
2. **Simplify values.** Replace each number with the simplest number that keeps the same role: $0$, then $1$, then $-1$, then the minimum, then the maximum. A bug that requires the value $1000007$ is usually a bug about the value being _large_, and $2$ triggers it just as well.
3. **Search for structure.** Before shrinking, try the inputs you already suspect: all equal, strictly increasing, all distinct, sorted, reverse sorted, one element repeated $n-1$ times.
4. **Stop when the input is small enough to reason about.** Usually that is fewer than ten elements. If it is not, the bug is probably in a part of the code the small input does not reach.

**Worked example.** Suppose your program computes the maximum subarray sum and fails on a random array of $1000$ elements. Shrink it:

- Delete elements from the front until it starts passing. It fails at length $7$.
- Delete elements from the back: it fails at length $4$.
- Simplify the values: replace each with the closest of $0$, $1$, $-1$. The failing input becomes $\{1, -3, 1, -3\}$.
- Look at it. The maximum subarray sum of $\{1, -3, 1, -3\}$ is $1$, computed at either index $0$ or index $2$. The program returns $-1$ or $0$. The bug is that the reset to $0$ inside the loop is wrong when the whole array is negative, or that the loop forgets to consider a single element.

Four numbers. The bug was in the initialization or the reset, and it would have taken an hour to find by reading code and printing traces on a thousand-element array.

**What you must get right.** A counterexample must be reproducible and must fail for the same reason each time. If shrinking changes the failure mode, you have found two bugs, and the second one is hiding the first.

### Checkpoint

**Conceptual.**

1. What are the four steps of the shrinking procedure, and in what order should they be applied?
2. Why is a counterexample more valuable than a failure message, and what makes it more valuable?
3. Explain why "simplify the values" often works better than "remove the elements" when the bug involves a numeric threshold.

**Code reading.**

1. This program fails on some input but not on the samples. Say which of the two likely inputs it mishandles, and why:

    ```cpp
    int best = 0;
    for (int i = 0; i < n; ++i) {
        int sum = 0;
        for (int j = i; j < n; ++j) { sum += a[j]; best = std::max(best, sum); }
    }
    ```

2. This program returns a value that is one too small whenever the array is sorted. Say what it computes instead of the maximum subarray sum, and rewrite it in one line:

    ```cpp
    int best = 0;
    for (int i = 0; i < n; ++i) {
        int sum = a[i];
        for (int j = i + 1; j < n; ++j) { sum += a[j]; best = std::max(best, sum); }
    }
    ```

**Implementation.** Write a shrinker for a failing input given as a list of integers and a program that reads the list and returns a value. The shrinker must repeatedly try removing one element and keep the removal whenever the program still fails, and must stop when no single removal preserves the failure. Report the smallest input it found and the number of program runs it took.

**Applied problem.** Your program computes the number of distinct values in a list, and it fails on some input. Shrink it by hand to at most five elements, and state what the bug is.

## 6.6 Debugging efficiently under a clock

**What it is.** A fixed order of operations that turns a failure into an explanation. It is a procedure, not a talent, and under a clock the procedure is the only thing that works.

**Why it matters.** In a contest, the temptation is to stare at the code and look for the mistake. That is a search over a space of size roughly the number of lines, with no feedback. The procedure turns it into a search over the failing input, which shrinks geometrically and reaches a four-element case in a couple of minutes.

**The order of operations.**

1. **Read the verdict.** The judge distinguishes a wrong answer from a run-time error from a time limit exceeded. These are different bugs and they need different investigations. Section "The counterexample catalog" below treats this in full.
2. **Reproduce locally.** If you cannot reproduce it, you cannot fix it. Copy the failing input exactly. If the judge does not give you the input, construct the smallest input you believe triggers it.
3. **Shrink it.** Module 6.5.
4. **Find the first divergence.** Compute the expected answer by hand for the shrunk input, then instrument the program to print its state at each step, and find the first place where its state differs from the expected one. The first divergence is the bug; everything after it is a consequence.
5. **Explain it in one sentence.** You are not done until you can say why the wrong value appears, in a sentence that would be convincing to someone who has not seen the code. If you cannot, you have located a symptom, not a bug.
6. **Fix the cause, not the symptom.** Changing the initialization because the answer was wrong on the all-negative case is fixing the symptom if the real problem is that the algorithm assumes $n \ge 2$.
7. **Add the shrunk input to your test set.** It is a regression test now, and it costs nothing to keep.

**Tools, in order of preference.**

- **Assertions on the invariant.** The cheapest and best. If your algorithm maintains "the first $i$ elements have been processed and `cur` holds the best sum ending at the current position", assert it. A violated assertion names the loop iteration where it broke.
- **A debugger with a breakpoint and a watch expression.** Best when the state is large.
- **Print statements.** Always works, and costs the most in time. Print the smallest informative thing: one line per loop iteration, with the loop index.
- **A reference implementation.** When the discrepancy is "my fast version disagrees with my slow version", the difference between their outputs is the whole diagnosis.

**Worked example.** A program gives a wrong answer only when the input has at least $1000$ elements. Small inputs all pass. The obvious move is to stare at the code, but the input size is the clue. Bisect on $n$: run it at $n = 500$, $n = 750$, $n = 1000$. It passes at $750$ and fails at $1000$, so the failure needs between $751$ and $1000$ elements. Now shrink within that range, and you find that the failure needs exactly $768$ elements.

$768 = 3 \times 256$. That is a power of two times three, and it is the signature of a **hash table that resizes at a power of two**. The program probably preallocates a table of size $1024$, computes an index with a modulo, and inserts at a wrong offset when the size changes. Or, more likely, it has a buffer of size $512$ and copies data at index $i$ into position $i + 256$ when the buffer grows, overwriting the wrong half.

The point is that the input size was the clue, and the clue turned a search over the code into a search over the code _and_ the number $768$. Under a clock, recognizing that $768$ is a suspicious constant is worth more than any amount of careful reading.

**What you must get right.** Do not change the algorithm until you can explain the failure in one sentence. Changing the algorithm when you do not understand the failure is how a working solution becomes a broken one, and it usually costs the problem.

### Checkpoint

**Conceptual.**

1. List the seven steps of the debugging procedure in order, and say which step is most often skipped and what it costs.
2. Why is "find the first divergence" more effective than "find where it goes wrong"? What does the first divergence give you that a later discrepancy does not?
3. Give one reason a failure might not reproduce locally, and one thing you can change to make it more likely to reproduce.

**Code reading.**

1. This loop is supposed to print the elements of a queue in order. Say what it prints instead, and say what the bug is in one sentence:

    ```cpp
    std::queue<int> q;
    q.push(1); q.push(2); q.push(3);
    while (!q.empty()) {
        std::cout << q.front() << ' ';
        q.pop();
    }
    ```

2. This function is supposed to return the index of the maximum element, and returns the wrong index when the maximum occurs twice. Say what it returns, and fix it in one line:

    ```cpp
    int argmax(const std::vector<int>& v) {
        int best = 0;
        for (int i = 1; i < v.size(); ++i) if (v[i] >= v[best]) best = i;
        return best;
    }
    ```

**Implementation.** Write a program that takes an array and returns the maximum subarray sum, and add three assertions: one that the running sum equals the sum of the current subarray, one that the running sum is never larger than the true maximum, and one that the reported answer is achieved by some subarray. Then deliberately introduce a bug that violates the third assertion, and show that the assertion catches it with the iteration number.

**Applied problem.** A program that sorts an array of $10^5$ integers produces the correct answer on almost every input and an incorrect one on about one in a thousand. Describe the debugging procedure you would follow, in order, and name the two measurements you would take first.

## 6.7 Differential testing

**What it is.** Running two implementations on the same inputs and comparing their outputs. One of the two is trusted because it is simple and has been verified; the other is the one under test.

**Why it matters.** It is the only technique in this part that scales. The brute force from module 6.3 is an oracle that answers any small instance, and it makes the correctness of an optimized algorithm into an empirical question. This turns "I believe the Fenwick tree version computes the same thing" into "I have checked it on 5000 inputs, and here is the one where it does not".

**The method, stated formally**, is given in the section "The differential testing method" below. The short version is this: for an optimized algorithm $A$ and a known-correct reference $B$, check that $A(x) = B(x)$ for every $x$ in the test set. A mismatch is a counterexample. A pass is not a proof.

**The requirements that make it work.**

- **Independence.** The reference must not share code with the implementation under test. If both use the same helper for the tricky part, the differential test says nothing about that helper.
- **Identical input.** The two programs must see byte-identical input, produced by the same generator, and the comparison must be on the outputs of the same run.
- **Exact comparison.** Compare the output byte for byte, not a parsed value. A program that prints `1` and a program that prints `01` are different, and the checker may disagree.
- **Coverage.** The generator must produce the edge cases of module 6.2 and the awkward structures of module 6.8, not just uniform random data. Random data is good at finding crashes and terrible at finding tie-breaking bugs.

**Worked example.** You have a brute force that counts pairs with $a_i < a_j$ in $O(n^2)$, and a Fenwick tree version in $O(n \log n)$. Write a generator that produces a random length between $0$ and $12$ and random values in $\{0, 1, 2, 3\}$, run both programs on 1000 such arrays, and compare their outputs.

The small alphabet is the important choice. With values in $\{0, 1, 2, 3\}$ and lengths up to $12$, duplicates and near-ties are common, which is exactly where the strict-versus-non-strict bug lives. Uniform random values in a huge range would produce almost no ties and would pass the broken version.

When the generator finds a disagreement, the shrunk counterexample is the payoff: it is a handful of numbers that you can check by hand in seconds.

**What you must get right.** Compare exact outputs, and include duplicate-heavy inputs in the test set. A differential test over uniform random data with distinct values is a test that cannot fail in the way your code is most likely to fail.

### Checkpoint

**Conceptual.**

1. Why must the reference implementation be independent of the code under test? Give a concrete case where sharing a helper makes the test useless.
2. Why is uniform random data a poor generator for finding tie-breaking bugs, and what should the generator do instead?
3. Does a passing differential test establish that $A$ is correct? State the precise claim it establishes and the claim it does not.

**Code reading.**

1. This comparison harness runs the two programs and compares their outputs. Say why it can report "identical" while the two programs actually disagree:

    ```cpp
    std::string a = runProgram("slow", input);
    std::string b = runProgram("fast", input);
    if (a == b) std::cout << "ok\n";
    ```

2. This harness compares only the last line of the output. Say what kind of bug it cannot detect, and rewrite it to compare everything that matters:

    ```cpp
    if (lastLine(a) == lastLine(b)) std::cout << "ok\n";
    ```

**Implementation.** Write a differential test harness for any two programs of your choice: a generator that writes a random input to a file, a runner that invokes both programs on it, and a comparator that reports the first byte at which the outputs differ, with its position. Run it on 200 inputs and report how many disagreements you found.

**Applied problem.** You have a quadratic baseline for counting increasing subsequences and a dynamic-programming version. Describe the generator you would write to maximize the chance of finding a disagreement, and say which two properties of the input you would vary deliberately.

## 6.8 Constructing adversarial test inputs

**What it is.** Inputs designed so that your solution, though correct, behaves badly. The official instructions say that legal but complex data is fair game for testing, which is a polite way of saying that the test set will include inputs chosen to break the intended approach.

**Why it matters.** A correct algorithm can still fail a time limit because of its constant factor or because of an unlucky interaction with the data. The contestants who are surprised are the ones who assumed "random" when the judge was thinking "adversarial".

**The adversarial families that matter.**

| Family | What it breaks |
| --- | --- |
| Sorted or reverse-sorted input | Code that assumes the data is unordered; quicksort with a bad pivot |
| All values equal | Tie-breaking, strict versus non-strict comparisons, deduplication |
| One value repeated $n-1$ times | Deduplication logic that scans for a distinct element |
| A hash table with colliding keys | `std::unordered_map` with the standard integer hash |
| A path graph | Recursive depth-first search at depth $n$ |
| A star graph | Breadth-first search queue size; center-of-mass arguments |
| A dense graph | Adjacency-matrix assumptions, quadratic edge scans |
| A bipartite graph | Coloring assumptions |
| Values at the extremes of the range | Overflow, underflow, off-by-one in the bounds |
| A repeating pattern of period $k$ | Algorithms with a periodicity assumption |
| An answer that requires 64 bits | Storage width |

**The hash collision attack, concretely.** `std::unordered_map<int, int>` with the standard hash uses the identity function, so the bucket index of a key is the key modulo the bucket count. An adversary who knows the bucket count can pick $k$ keys that are congruent modulo $k$, and every lookup and insertion then lands in the same bucket. The map degrades from expected $O(1)$ to $O(n)$ per operation, and the total cost becomes $O(n^2)$. This is not hypothetical: it is the standard reason contest solutions that use `std::unordered_map` on adversarial input either use `std::map` or mix in a random hash.

**Worked example.** A solution uses a recursive depth-first search on a graph with $n = 10^5$ vertices. The tests include a graph that is a single path: vertex $1$ connected to $2$, $2$ to $3$, and so on. The recursion depth becomes $10^5$. In C++ this is near the stack limit and may survive; in Java it throws `StackOverflowError`; in CPython it hits the recursion limit of $1000$ and raises `RecursionError`. The algorithm is $O(V + E)$ and entirely correct, and the submission fails with a run-time error on the test the judge chose.

The fix is not a better algorithm. It is an explicit stack, or a larger recursion budget combined with a proof that the depth is bounded. Module 5.10 of the [language transition part](/start/from-ap-csa/part-5-language-transition) gives the per-language limits and the iterative rewrite.

**What you must get right.** Construct the legal-but-nastiest input you can for the solution you have written, and run it. An adversarial input that makes your program slow or crash tells you to fix it now, when there is still time, rather than in the contest, when there is not.

### Checkpoint

**Conceptual.**

1. Why does the official guidance say that legal but complex data is fair game for testing? What does that tell you about the test set you cannot see?
2. Explain how the standard integer hash turns `std::unordered_map` into an $O(n^2)$ structure under adversarial keys, and give the two fixes.
3. Why does a path graph break a recursive depth-first search even though the algorithm's time complexity is optimal?

**Code reading.**

1. This code is correct on random data and slow on sorted data. Say why, and give the one-line change that fixes it:

    ```cpp
    std::vector<int> v = read();
    std::sort(v.begin(), v.end());
    for (int i = 0; i < v.size(); ++i) if (v[i] == v[i - 1]) count++;
    ```

2. This program computes the number of distinct values in a set. Say what input makes it wrong, and rewrite the loop so that it is correct for every input:

    ```cpp
    int distinct = 0;
    for (int i = 0; i < n; ++i) {
        bool seen = false;
        for (int j = 0; j < i; ++j) if (a[j] == a[i]) seen = true;
        if (!seen) distinct++;
    }
    ```

**Implementation.** Write a generator that produces the six adversarial inputs described above for a problem that reads an array of $n$ integers and prints the number of distinct values: all equal, strictly increasing, reverse sorted, one value repeated, values at the extremes of the signed 32-bit range, and a random array. Run your solution on each and report the time of each.

**Applied problem.** A problem gives a graph with $n$ vertices and $m$ edges. List three graphs that are legal under the constraints and that break a different standard implementation each, and say which implementation each one breaks.

## 6.9 Writing short convincing correctness proofs

**What it is.** A short argument that the algorithm computes what was asked. Three parts, always: the claim, the assumptions it needs, and the reason the result follows from them.

**Why it matters.** A proof is not decoration. It is the only thing that tells you the solution is right on the tests you did not run, and writing one under a clock is faster than discovering the failure during the contest. It is also the difference between a solution that scores on this contest and a technique that scores on every contest.

**The four forms that cover almost every contest algorithm.**

- **The invariant.** A statement about the program's state that holds at the start of every loop iteration and is preserved by the loop body. The preservation argument is the proof. The Fenwick tree article uses this form.
- **Induction.** For a recursive algorithm or one that processes items in order: the claim holds for the first $k$ items, and the step from $k$ to $k+1$ preserves it.
- **The exchange argument.** Take an optimal solution, find the place where it disagrees with your greedy choice, swap the two, and show the result is still feasible and no worse. The [interval scheduling article](/algorithms/greedy/interval-scheduling) develops this form in full.
- **Contradiction.** Assume the algorithm fails, derive that some quantity is simultaneously larger and smaller than itself, or that a known count is exceeded. The [pigeonhole principle](/start/from-ap-csa/part-3-discrete-mathematics) is the contradiction argument in its most common form.

**The shape to use under a clock.** One paragraph, three sentences, in this order:

1. "The algorithm maintains the invariant that after processing the first $i$ elements, `best` is the maximum value of any subarray ending at or before position $i$."
2. "Before the loop, $i = 0$ and `best` is the value of the empty prefix, so the invariant holds."
3. "Each iteration extends the current subarray or restarts it, and takes the better of the two, so the invariant is preserved; when the loop ends, `best` is the maximum subarray sum over all subarrays, which is what was asked."

That paragraph is worth more than an hour of reading code, because it names the exact quantity the loop maintains, and the bug in the implementation will be a violation of that invariant.

**What you must get right.** Name the claim and the assumption. "Obviously optimal" is not a proof, and neither is "it works on the samples". A proof that does not say what the algorithm maintains is not a proof, because there is nothing to check it against.

### Checkpoint

**Conceptual.**

1. What three things does a correctness proof always contain, and why is the third one the one that carries the argument?
2. Give the four proof forms, and name a contest technique that uses each.
3. Why is writing a proof often faster than debugging a wrong program?

**Code reading.**

1. This loop is supposed to compute the maximum subarray sum. State the invariant it maintains, and say which line breaks it:

    ```cpp
    long long best = LLONG_MIN, cur = 0;
    for (int x : a) {
        cur = std::max(x, cur + x);
        best = std::max(best, cur);
    }
    ```

2. This loop is supposed to leave the array sorted. State the invariant, and say what it assumes about the input:

    ```cpp
    for (int i = 1; i < n; ++i) {
        int j = i;
        while (j > 0 && a[j - 1] > a[j]) { std::swap(a[j - 1], a[j]); --j; }
    }
    ```

**Implementation.** Write, in one paragraph, a correctness argument for the binary search that finds the first index at which a monotone predicate holds. Your paragraph must name the invariant, show that it holds before the loop, and show that it is preserved by each iteration.

**Applied problem.** A greedy algorithm picks the cheapest item that does not conflict with the ones already picked. Write the exchange argument that makes this safe, and say exactly which two things you must check about the swap you perform.

## 6.10 Managing time and submissions under contest conditions

**What it is.** An allocation problem. A contest is a fixed number of minutes and a fixed number of problems, and the score is what you finish. Nothing else matters.

**Why it matters.** The competitor with the best algorithm in the room can score zero. So can the fastest coder. The contest is won by the person who converted the most time into points, which is a scheduling decision rather than an intellectual one.

**The schedule that works.**

1. **Read every problem first, before solving any.** Ten minutes of reading gives you the map. Most contests have one problem that is clearly easier than the others, and you cannot know which without reading all of them.
2. **Triage.** Sort the problems by expected value: the probability that you can solve it times the number of points it is worth. Start with the problem you are most certain to finish, not the one that looks most interesting.
3. **Take the easy point.** If a problem has a trivial observation worth five minutes, take it. Points early reduce the risk of running out of time with nothing.
4. **Bank what you have.** Submit as soon as a solution is correct, even if it is slow. A submitted correct solution is worth points; an unsubmitted correct solution is worth nothing, and a later rewrite of it might break it.
5. **Keep the last submission safe.** Never leave a problem in a state where the only copy of your solution is an edit you have not tested.
6. **Reserve the last part of the contest.** The last fifteen minutes are for re-reading the statements of the problems you attempted, checking your output format against the specification, and making sure the easy solutions are submitted.
7. **Read the output format of every submitted problem once more.** A wrong answer caused by a formatting mistake is the most expensive kind, because the algorithm was right.

**What the judge tells you.** The published feedback distinguishes several failure kinds, and each means something different: a wrong answer, a time limit exceeded, a run-time error or memory limit exceeded, an empty output file, and a missing output file. Compile errors are reported with the compiler's own messages. The next section treats these in detail, because reading the verdict correctly is half of the debugging.

**Worked example.** You have 150 minutes and three problems worth 100 points each. Problem A looks like a straightforward greedy. Problem B is a dynamic program with an unusual state. Problem C is a graph problem where you can see the intended technique but not the implementation.

Read all three: ten minutes. Then attempt A, because it is the one you will certainly finish; budget 40 minutes and submit it as soon as it passes the samples, even if you have not tested the maximum case. Then attempt C, because you can at least write the shape of the solution; budget 50 minutes and stop at 90 minutes remaining regardless of progress. Then attempt B, because the dynamic program is the one most likely to be complete in the remaining 60 minutes. Reserve the last 15 minutes for checking output formats and re-submitting.

The alternative schedule, which is the one most competitors choose, is to start with the problem that interests them. It produces a higher score on the problem it picks and a lower total score.

**What you must get right.** Never let one problem consume the entire contest, and submit every correct solution immediately. The clock does not reward the hardest problem you worked on; it rewards the number of points you hold when it stops.

### Checkpoint

**Conceptual.**

1. What is the triage rule, and why does it start with the problem you are most certain to finish rather than the most interesting one?
2. Why is it correct to submit a solution that is correct but slow, when the time limit is two seconds and your solution takes four?
3. Why is the last fifteen minutes of a contest better spent re-reading specifications than starting a new problem?

**Code reading.**

1. This submission reads and prints the answer but has one formatting error that the checker will reject. Say what it is:

    ```cpp
    std::cout << answer << " ";
    ```

2. This program produces the right answer but is likely to time out on the largest test. Say which line is the reason, and what you would do instead:

    ```cpp
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            if (a[i] + a[j] == target) { std::cout << i << ' ' << j; return 0; }
    ```

**Implementation.** Take three of your own past solutions and write, for each, a checklist of the things you must verify in the final fifteen minutes: the output format, the degenerate case, the maximum input, and the storage width. Keep the checklist and reuse it.

**Applied problem.** A contest has three problems worth 100, 100 and 100 points. You estimate that you can finish the first with 80 percent probability, the second with 50 percent, and the third with 20 percent. Give the expected-value ordering you would use, and say what you would do if the first problem turned out to take twice as long as you estimated.

## The differential testing method

Let $A$ be an optimized algorithm and let $B$ be a known-correct reference implementation. Let $T$ be a finite test set of legal inputs. The differential test checks that

$$A \equiv_T B \quad\Longleftrightarrow\quad \forall x \in T,\; A(x) = B(x)$$

where $A(x)$ and $B(x)$ are the outputs of the two implementations on the same input, compared exactly.

**The claim the method establishes.** If the test finds an $x \in T$ with $A(x) \ne B(x)$, then the triple $(x, B(x), A(x))$ is a **counterexample**: a witness that $A$ and $B$ disagree, and therefore a witness that $A$ is not equivalent to the reference on all legal inputs. Since $B$ is correct by assumption, $A$ is not correct either.

::: math definition Differential test
A differential test is a finite procedure that compares an implementation under test with a trusted reference on a finite set of inputs, and reports a counterexample if any comparison fails. It is a one-sided check: a failure is conclusive, and a pass is not.
:::


**The claim the method does not establish.** If every comparison passes, then $A$ and $B$ agree on $T$. It does **not** follow that they agree on every legal input:

$$A \equiv_T B \quad\not\Longrightarrow\quad A \equiv B$$

The implication fails because $T$ is finite and the space of legal inputs is not. There are inputs outside $T$ on which the two differ, unless a separate argument (a proof, or an exhaustive test over a complete and finite input space) rules them out. **A passing differential test is not a proof of correctness.** It is evidence, and good evidence, but it is not a proof.

::: math theorem Soundness of the differential test
The differential test never reports success while the implementation under test
disagrees with the reference on any input in the test set. Its conclusion is
therefore sound, and its silence is inconclusive.
:::


**The three conditions that make the test meaningful.**

1. **The reference is correct and independent.** $B$ must be trusted on the inputs in $T$, and it must not share the code that is under test. If $B$ calls the same helper that $A$ calls for the tricky part, the test verifies the difference between the two programs and says nothing about the helper, which is exactly where the bug usually is.
2. **The comparison is exact.** The outputs are compared byte for byte, including whitespace and the trailing newline. A comparison that parses the numbers and compares their values will pass a program that prints the right numbers in the wrong order.
3. **The test set covers the boundaries.** $T$ must contain the smallest legal input, the largest legal input, the degenerate shapes of module 6.2, and the adversarial structures of module 6.8. A test set of uniform random inputs covers none of these, which is why a tie-breaking bug can survive thousands of comparisons.

**The workflow.** Write the reference first. Write the generator, and make the generator produce the awkward inputs deliberately rather than hoping for them. Run both implementations on each input of $T$ and compare exactly. On a mismatch, shrink the input with the procedure of module 6.5, then diagnose with the procedure of module 6.6, and keep the shrunk input as a regression test.

**What it is worth.** A differential test that compares a quadratic baseline against an optimized implementation on a few thousand generated inputs will find essentially every bug that is not a bug in the specification. That is a large fraction of the bugs that cost points, and it costs minutes.

## The counterexample catalog

The judge reports what happened to your program. The three verdicts that matter most describe three different failures, and each has its own cause and its own debugging path. Conflating them is how a contestant spends an hour on the wrong question.

| Verdict | What happened | Usual causes | Where to look first | What it does not mean |
| --- | --- | --- | --- | --- |
| Wrong answer | The program ran and produced output that differs from the expected output | Misread specification, wrong algorithm, off-by-one, wrong tie-breaking, overflow, wrong output format | The specification first, then the shrunk failing input | That the algorithm is wrong. The algorithm is often right and the output format is wrong |
| Run-time error or memory limit exceeded | The program crashed, or used more memory than the limit allows | Out-of-bounds access, uninitialized value, division by zero, null dereference, stack overflow from deep recursion, an array that is too large | The crash type; the recursion depth against the worst case; the memory footprint of the largest structure | That the logic is wrong. The program may be entirely correct and crash on one input |
| Time limit exceeded | The program was correct but did not finish some test in time | Complexity too high for the largest constraint, an accidental quadratic, slow input parsing, a hash table defeated by adversarial keys, too deep a recursion in a language with a small stack | The complexity against the constraints, then the constant factors | That the algorithm is wrong. It is usually right and too slow |

The published feedback also distinguishes an **empty output file** and a **missing output file**. An empty output file usually means the program wrote nothing: it crashed before printing, it read the input wrong and looped forever on a malformed read, or it printed to standard error instead of standard output. A missing output file means the program wrote to a file when the problem expected standard output, which is the reverse mistake.

**Why the distinction matters.** A wrong answer is a reasoning bug, and the reasoning is in the specification and the algorithm. A run-time error is a memory-safety bug, and the reasoning is about indices, lifetimes, and stack depth. A time limit exceeded is a complexity bug, and the reasoning is about the largest constraint and the constant factor. The three require three different investigations, and the first question in each case is different:

- Wrong answer: "what does the specification actually ask?"
- Run-time error: "what does the program do at the moment it dies?"
- Time limit exceeded: "how many operations does the program perform on the largest input?"

**The two verdicts that are easy to misread.** A wrong answer on the first sample is a specification problem, because the sample is the one input whose expected output you can see. A program that fails only on the largest test is a complexity or memory problem. A program that fails only on the smallest test is almost always a degenerate-case problem, and the fix is in the initialization of a loop or of a maximum.

## Review checklist

You are ready for the contest tracks when you can answer the following without consulting the text.

- Write the input and output contract of an unfamiliar problem in three lines, including the answer for the smallest legal input.
- Name the five edge cases that recur across contest problems, and say which one each catches.
- State the rule that makes a brute-force baseline worth writing, and name the three reasons.
- Explain why a passing differential test is not a proof, and state what the test does establish.
- Describe the four steps of the shrinking procedure, and explain why each one shortens the search.
- List the three verdicts the judge reports and the question each one makes you ask.
- Give one adversarial input family for a hash table, one for a recursive traversal, and one for a tie-breaking comparison.
- Write the three-sentence shape of a correctness proof, and name the four proof forms.
- Give the triage rule, and explain why the last fifteen minutes of a contest are not for a new problem.

## The pre-contest checklist

The full checklist, with the reason behind each item, is on the [pre-contest checklist page](/reference/contest-checklist). The short version is:

- Verify the official contest rules and the supported language versions.
- Prepare an authorized local development environment.
- Be able to write the input and output setup from memory, for each language you might use.
- Know how to estimate the time and memory a solution needs from the constraints.
- Test the minimal input and the maximal input.
- Check for overflow.
- Confirm that the recursion strategy is safe for the deepest possible input.
- Understand the input and output formatting exactly.
- Recheck the submission, and the remaining time, before the clock stops.

## The rules of the competition

The rules are the competition's, and they are not A.A.Y.N.T.N.'s. As last checked against the published official instructions on 21 October 2026, the following is what those instructions say, in substance:

- During an active contest, you may consult only references that cover the basic functionality of your programming language, such as syntax, library functions, and input and output.
- Consulting algorithm resources is not permitted.
- Using pre-written code or templates is not permitted.
- Using generative artificial intelligence services is not permitted.

A.A.Y.N.T.N. is an independent preparation resource. It is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad. Nothing on this site is a substitute for the official instructions, and the official instructions are the only authority on what is permitted during a contest.

These rules change. Re-read the official instructions before every contest, and never keep this page, or any other reference page, open while a contest is running.
