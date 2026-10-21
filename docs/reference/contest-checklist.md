---
id: reference.contest-checklist
title: The pre-contest checklist
summary: Nine checks to work through before a contest starts, each with the failure it protects against.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [checklist, pre-contest, preparation, time limit, overflow, recursion]
prerequisites:
    required: []
    recommended: [start.contest-literacy]
reviewed: false
---

A checklist is worth writing when the same mistake keeps costing the same points. These nine checks are the ones that recur, and each one names the failure it prevents.

Work through the list once per contest, before the clock starts. A checklist read under time pressure is not a checklist; it is a list of things you would check if you had time.

## 1. Verify the official rules and the supported language versions

Read the [official instructions](/reference/usaco-rules/) and confirm two things: which languages are accepted for submission right now, and which compiler or interpreter versions the judge is using.

The rules change between seasons, and language support has changed before: Pascal was accepted for years and then discontinued. A version mismatch is a silent failure that costs a whole problem, because the code compiles at home and fails on the judge. If the instructions say Python 3.6 and your laptop has 3.12, your f-strings and your `match` statement are not available to you, and nothing will tell you until the submission comes back.

## 2. Prepare an authorized local development environment

Check that your compiler or interpreter is the version the judge runs, that your editor saves in the right character encoding, and that the environment is one you are permitted to use during the contest.

This is also the moment to disable anything that reaches the network or the cloud: a compiler plugin that uploads your code, an editor with an assistant built into it, a machine with an account already signed in. The contest instructions prohibit consulting algorithm resources, using prewritten code templates, and using generative artificial intelligence services during an active contest. Having the capability present is an accident waiting to happen, and removing it before the contest is far easier than remembering to avoid it while the clock is running.

## 3. Practice writing the input and output setup from memory

For each language you might use, be able to write the reading and writing boilerplate without looking it up: the speed flags for C++, the buffered reader for Java, the bulk read for Python, the `fread` loop for C.

Two reasons. The first is mechanical: the boilerplate is the part of the program most likely to contain a subtle error, and writing it from memory is the only way to be sure you have never tested it. The second is the rule: during a contest you may consult references covering basic language functionality, but you may not use prewritten code or templates. A template you have rewritten yourself until you could reproduce it from nothing is preparation. A template you copied is a resource you are not permitted to use.

The [template library](/templates/) lists the full form for each of the six languages.

## 4. Know how to estimate time and memory from the constraints

Before writing an algorithm, convert the constraints into an operation count. An $O(n^2)$ algorithm on $n = 2 \times 10^5$ performs about $4 \times 10^{10}$ operations, which does not fit in any time limit; an $O(n \log n)$ algorithm performs about $3.6 \times 10^6$, which is comfortable.

Do the same for memory. A `std::vector<long long>` of $10^6$ elements is 8 MB; a Python list of $10^6$ small integers costs roughly 8 MB of pointers plus the objects themselves; a Java `ArrayList<Integer>` of $10^6$ elements costs about 24 MB because of boxing. The memory limit is a constraint in exactly the way the time limit is.

The technique is in the [algorithm analysis part](/start/from-ap-csa/part-2-algorithm-analysis/), and the per-language costs are in the [language centers](/languages/).

## 5. Test the minimal input and the maximal input

Every problem has a smallest legal input and a largest legal input, and they break different things.

The smallest legal input finds the degenerate-case bugs: a loop that never runs, an empty container, a pair that does not exist, a maximum over nothing. These are the bugs that hide best, because the program returns a plausible value rather than crashing.

The largest legal input finds the scale bugs: an accidental quadratic, a stack that runs out of depth, an array that does not fit, an integer that overflows. Construct them deliberately rather than hoping the sample data is large.

## 6. Check for overflow

Decide, per problem, whether the answer and the intermediate values need 64 bits, and make the decision before you write the code.

The safe habit is to widen before you multiply, not after. In C++, `a * b` where both operands are `int` is computed as `int`, and overflows before the result is widened; writing `1LL * a * b` forces the computation into 64 bits. The same trap exists wherever the intermediate value is the larger one: a sum over $10^5$ elements of size $10^9$ is $10^{14}$, which is far outside a 32-bit integer.

A quick scan for the danger words in a statement helps: "the total", "the sum of all", "the number of ways", "the product". If the answer is a count of anything, check whether it can exceed $2^{31} - 1$.

## 7. Confirm the recursion strategy is safe for the deepest possible input

If your solution recurses, compute the maximum depth the input can force, and compare it with the limit of the language you are submitting in.

A path-shaped graph gives a depth-first search a depth equal to the number of vertices, so an $O(V + E)$ recursive traversal is not automatically safe. C++ gives roughly $10^5$ frames before the stack overflows. Java throws a `StackOverflowError`, which is an `Error` and not an `Exception`, so `catch (Exception e)` will not catch it. CPython hits its recursion limit of 1000 first, and raising the counter with `sys.setrecursionlimit` does not make deep recursion safe, because each Python-level call still consumes a C stack frame underneath.

The per-language numbers and the iterative rewrite are in the [language transition part](/start/from-ap-csa/part-5-language-transition/).

## 8. Understand the input and output formatting exactly

Read the input and output specification and write it out in your own words. Confirm how many values to print, in what order, separated by what, whether a real number is required and to how many decimal places, and whether the statement permits any valid answer or requires a specific one.

Then confirm the delivery convention. Older problems use files named in the statement; since December 2020 the tasks have generally used standard input and standard output. The specification of each problem says which, and the specification is the authority.

Also check the small mechanical points that the official instructions single out: a newline at the end of every output line, including the last; no carriage returns; no trailing spaces; no extra blank line at the end of the output. A program that prints the right numbers in the wrong order is a wrong answer, and so is one that prints the right numbers with the wrong framing.

## 9. Recheck the submission and the remaining time

Before the clock stops:

- Confirm that every solution you want credit for has been **submitted**, not merely written. An unsubmitted solution is worth nothing.
- Confirm that the submission language selected in the judge's dropdown matches the language you intended.
- Re-read the output format of each submitted problem one last time.
- Confirm that the last submission of each problem is the one you want graded. Only the last submission is graded.
- Note the remaining time and use it to re-verify the smallest and largest inputs on the problem you consider most at risk.

## What is not permitted during an active contest

Restating the rule plainly, because it is the one that matters most and the one most often forgotten:

- **Algorithm references are not permitted.** Only references covering basic language functionality, such as syntax and library functions, may be consulted.
- **Prewritten code templates are not permitted.** All code must be written from scratch.
- **Generative artificial intelligence services are not permitted.** The official instructions name them explicitly.

**This page is preparation material, not a resource to keep open during a contest.** Close it, along with every other reference, before the timer starts. The checklist exists so that the knowledge is in your head and in your fingers, not so that you can consult a list while the clock runs.

The rules are the competition's. Re-read the [official instructions](/reference/usaco-rules/) before every contest, because they change.
