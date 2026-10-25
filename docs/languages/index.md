---
id: languages.overview
title: Comparing the six languages
summary: What each of the six languages is good at, what it costs, how the containers and the call stacks differ, and which of them USACO accepts for submission.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [language comparison, contest languages, USACO submission languages, STL, recursion limit]
prerequisites:
    required: []
    recommended: [start.language-transition, start.contest-literacy]
reviewed: false
draft: false
---

<script setup lang="ts">
import PrerequisiteGraph from "../.vitepress/theme/components/PrerequisiteGraph.vue";
import Synonyms from "../.vitepress/theme/components/Synonyms.vue";
</script>

<Synonyms terms="language centers, programming language reference, contest language comparison, choosing a language" />

Six languages appear in this encyclopedia, and they are not six ways of writing the same program. They differ in what they make easy, in what they make expensive, in how much memory each element costs, and in how deep a recursion may go before the program dies. This page compares them so that you can choose one deliberately instead of by habit.

## The submission status of each language

**C, C++, Java and Python are the languages USACO currently accepts for submission.** Every problem in a USACO contest can be submitted in any of those four, and the published instructions describe the toolchain used for each of them.

**Pascal support has been discontinued.** The published USACO instructions say so explicitly, and no Pascal program can be submitted today.

**JavaScript is not among the listed submission languages.** Nothing in the published instructions offers it, and the USACO Guide describes the supported set as C++, Java and Python, with C also supported.

The Pascal center and the JavaScript center in this encyclopedia are therefore educational reference material. They exist so that you can read an algorithm expressed in those languages, and so that the ideas behind the implementations in the other four are visible from more than one direction. They are never presented as official submission solutions, and no program in this encyclopedia should be described to a judge as a Pascal or JavaScript submission.

A.A.Y.N.T.N. is an independent preparation resource. It is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad. The submission status described above reflects the published USACO contest instructions, which were last checked on 21 October 2026.

## What each language is good at

| Language | Strongest for | Weakest for |
| --- | --- | --- |
| C | Smallest memory footprint, exact control of layout, learning how memory works | Anything that needs a container library; the work is in the scaffolding |
| C++ | The widest container library of the six, and the one the tightest time limits are written for | Compile times, template errors, and a large surface of accidental complexity |
| Java | Clear ownership and lifetime, fast enough for nearly every USACO problem, an excellent standard library | The ceremony of classes, and boxing costs when a primitive is put into a collection |
| Python | The shortest distance between an idea and a working program; excellent for learning and for prototyping | A large constant factor per operation, memory overhead per element, and a hard recursion ceiling |
| Pascal | Readable syntax, explicit arrays, and a small language to learn | No submission route, a dated standard library, and no competitive-programming ecosystem |
| JavaScript | Fast iteration with `Map`, `Set` and typed arrays, and a decent event model | No submission route, a small standard library for data structures, and a finite call stack |

## What each language costs

The useful question is not which language is fastest, because that depends on the problem. It is which language lets you write the algorithm you actually need without paying for machinery you do not use.

| Language | The cost you pay | The cost you avoid |
| --- | --- | --- |
| C | You write every container yourself, and every allocation needs a matching release | You never pay for a container you did not ask for |
| C++ | Compile time, and a template error message that can be longer than your program | Almost nothing: the standard library covers the whole problem space of a contest |
| Java | An object header on every heap object, and an autoboxing conversion at every collection boundary | The garbage collector removes every leak you would otherwise have to hunt |
| Python | A large constant factor per operation, and a large per-element memory cost | You write the algorithm directly, with no ceremony and no manual memory management |
| Pascal | Nothing to pay, because nothing modern is available to pay for | A submission route, and any library that the other languages take for granted |
| JavaScript | The garbage collector, the prototype chain, and a standard library that stops at `Map` and `Set` | A very small learning curve, and closures that make some recursive patterns easy to express |

## How the containers differ

Every language here can hold a sequence, a mapping, and a set. The difference is in the cost of the operation, not in the concept.

| Need | C | C++ | Java | Python | Pascal | JavaScript |
| --- | --- | --- | --- | --- | --- | --- |
| Growable sequence | Write it | `std::vector` | `ArrayList` | `list` | dynamic `array of` | `Array` |
| Double-ended queue | Write it | `std::deque` | `ArrayDeque` | `collections.deque` | Write it | `Array` with an index |
| Priority queue | Write it | `std::priority_queue` | `PriorityQueue` | `heapq` | Write it | Write it |
| Ordered map | Write it | `std::map` | `TreeMap` | `dict` plus `sorted` | `TDictionary` plus sorting | `Map` plus sorting |
| Hash map | Write it | `std::unordered_map` | `HashMap` | `dict` | `TDictionary` | `Map` |
| Set | Write it | `std::unordered_set` | `HashSet` | `set` | `TStringList` as a set | `Set` |
| Fixed-width numeric buffer | `int8_t` array | `std::array` or `std::vector` | `int[]` | `array` module | `array of Integer` | `Int32Array` |

The table above describes what the standard library of each language offers. The time complexity of each container is documented in the center for that language, and the same operation can have a different bound in different languages. `push_back` on a `std::vector` is amortised $O(1)$ because the vector doubles its capacity; `append` on a Python `list` is amortised $O(1)$ for the same reason; `push` on a Java `ArrayList` is amortised $O(1)$; and `SetLength` on a Pascal dynamic array is $O(1)$ only when the array does not need to move, because growing it copies the old contents.

## How recursion behaves

A recursive call consumes a stack frame, and every language in this encyclopedia has a finite stack. The sizes differ by orders of magnitude, so the same recursive program can be safe in one language and fatal in another.

**A chain-shaped graph gives recursion depth proportional to the number of vertices.** A graph on $V$ vertices arranged as a path has depth $V$ under a depth-first search, so an $O(V + E)$ recursive depth-first search is _not_ automatically safe. The linear time bound says nothing about the depth of the call stack, which is a separate resource.

| Language | Default limit on recursion depth | Practical guidance |
| --- | --- | --- |
| C | The thread stack, commonly 8 MB, divided by the size of a frame | Safe to about $10^5$ frames of a simple function; use an explicit stack for a long chain |
| C++ | The same budget, but frames are larger because locals are objects | Use an explicit stack unless the depth is provably small |
| Java | The thread stack, and a `StackOverflowError` when it is exhausted | A few thousand to a few tens of thousands of frames; prefer an explicit stack on any large graph |
| Python | A counter, `sys.getrecursionlimit()`, defaulting to 1000 | Raising the counter does not make deep recursion safe, because the C stack underneath can still overflow |
| Pascal | A fixed byte budget, reported as a runtime error 202 | Treat any recursion deeper than a few thousand calls as unsafe |
| JavaScript | A fixed byte budget, reported as a `RangeError` | On the order of ten thousand frames for a simple function; use an explicit stack |

The full reasoning, and a concrete iterative rewrite of a recursive depth-first search for each language, appears in the center for that language.

## Choosing for a contest

If you already know one of the four submission languages well, use it. The constant factor of a language you know is smaller than the constant factor of a language you do not.

If you are starting from nothing, C++ is the usual answer, because the standard library covers the entire problem space of a contest. Java is a close second and is a good first language, because the compiler catches whole classes of mistake that C and C++ leave to run time. Python is the best language for learning, because the distance between an idea and a working program is shortest, and because the failure modes are visible rather than silent.

The published USACO instructions give roughly twice the time limit to Java and Python submissions as to C and C++ submissions, with the caveat that each contest or problem may use slightly different limits. The instructions also state plainly that on some higher-division problems it may not be possible to solve all inputs within the limit using Python, because of its slowness. A time limit is not a substitute for an efficient algorithm, and the languages differ most sharply exactly where the constant factor matters.

## The centers

<PrerequisiteGraph focus="languages.cpp17" />

Each center below has the same shape: a handbook of the language, the common operations, the time complexity of the standard containers, the performance hazards, a recommendation about recursion, debugging advice, and a template library to learn before a contest.

- [The C center](/languages/c/) covers the language as the C standard defines it, with explicit bounds checking and a documented cleanup path for every allocation.
- [The C++17 center](/languages/cpp17/) covers the standard library in detail, including the iterator invalidation rules that decide whether a modification inside a loop is safe.
- [The Java center](/languages/java/) covers the three input strategies, from `Scanner` to a custom buffered parser, and the cost of boxing.
- [The Python center](/languages/python/) covers the language the USACO judge actually runs, its memory overhead, and the recursion ceiling that raising a counter does not remove.
- [The Pascal center](/languages/pascal/) is educational reference material written against Free Pascal, for readers who meet Pascal in older material.
- [The JavaScript center](/languages/javascript/) is educational reference material written against Node.js, for readers who want to see the same algorithm in a scripting runtime.
