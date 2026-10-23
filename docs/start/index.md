---
id: start.overview
title: How to use this encyclopedia
summary: The four ways into the encyclopedia, what a lesson contains, and how the local progress record works.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [orientation, study plan, prerequisites, progress, lessons]
prerequisites:
    required: []
    recommended: []
reviewed: false
draft: false
---

A.A.Y.N.T.N. is an encyclopedia rather than a course. It will not assign your week or tell you which problem to attempt on Tuesday. It does something narrower and, we hope, more durable: it collects the whole body of competitive programming knowledge into one fixed order, with the proofs and the complexity arguments that most explanations quietly omit.

This page explains what is inside, how the pieces fit together, and how to enter from wherever you are starting.

<Synonyms terms="orientation, getting started, study guide, how to read this site" />

## Four ways in

Every reader arrives with a different gap. Choose the route that matches the gap you actually have, not the one that matches the most advanced person in the room.

### If you are an AP Computer Science A student

You have the syntax, the control flow, and a first exposure to Big-O. What you do not have is depth in data structures, discrete mathematics, complexity analysis, or contest-style input and output.

Begin at [From AP Computer Science A](/start/from-ap-csa/). That page is a bridge: it separates what the AP course covers from what it does not, then routes you into six ordered parts.

### If you are a complete beginner

Start with a language center, not with algorithms. Pick one of the six languages and learn to read a file, parse integers from standard input, and write a loop that runs a million times without stopping.

The fastest route to feeling competent is to write a small program that reads one line and prints its tokens reversed. The next is to write one that counts how often the most frequent token appears. Both are small, both finish in an afternoon, and both teach the loop, the map, and the input conventions that everything later assumes.

Once you can write that kind of program without looking things up, start with [Computational foundations](/start/from-ap-csa/part-1-computational-foundations), then [Algorithm analysis](/start/from-ap-csa/part-2-algorithm-analysis).

### If you are an experienced competitor

You know the standard techniques. What you probably lack is the ability to derive a technique you have never seen, and the habit of proving that your solution is correct before you submit it.

Two gaps are worth closing first. The first is amortized analysis, which explains why the standard `push` into a growing array is fast even though the worst individual operation copies the whole array. The second is the practice of writing a short correctness proof before coding, which is the subject of [Contest problem-solving literacy](/start/from-ap-csa/part-6-contest-literacy).

After that, use the division tracks rather than the academy. The academy explains why the algorithms work; the tracks decide what to learn next.

### If you are a general algorithm learner

You want to understand algorithms, not necessarily to compete. Read the academy in order. Parts 1 and 2 give you the machine and the ruler, part 3 gives you the mathematics that most algorithm texts assume, part 4 gives you the vocabulary, part 5 removes the language barrier, and part 6 turns everything into a repeatable contest routine.

If you already know one language well, skim part 5 and read the table of Java to C++17 equivalences. If you have never written a program, do not skim it.

## What a lesson contains

Subject lessons follow a fixed twenty-two-part structure, listed in the project's contributing guide. The parts that carry the most weight are the formal model, the correctness proof, and the complexity proof, because that is where the transferable knowledge lives.

A typical subject lesson opens with an at-a-glance panel: the time and space complexity of the specific implementation shown, the assumptions it makes, and the background it assumes you have. The assumptions matter more than they look. Dijkstra's algorithm has a stated complexity of $O((V + E)\log V)$ only under the assumption that edge weights are nonnegative; the same code applied to negative weights is not merely slower, it is wrong.

The middle of a lesson moves from motivation to derivation. It shows the naive approach first, then the insight that replaces it, then a formal statement of what the algorithm computes. The proof section names its claim, its assumptions, and the reason the result follows. A lesson that says "obviously optimal" has not proved anything, and the guide rejects that phrasing for that reason.

The last third is practical. It lists the situations in which the algorithm is the wrong choice, the mistakes students actually make, the contest strategy around it, and a progression of problems with a hint ladder. Hints are deliberately withheld until you ask, because a hint you read early is worth much less than the twenty minutes you would have spent.

## What the division tracks mean

A.A.Y.N.T.N. organizes contest material into four tracks. The names follow the division convention used by USACO-style competitions: Bronze, Silver, Gold and Platinum. A.A.Y.N.T.N. is an independent preparation resource and is not affiliated with, endorsed by, or supported by the United States Computing Olympiad.

The tracks describe skill, not age, school year, or hours spent. A rough description of each:

- **Bronze** problems reward careful simulation, brute force over small inputs, and elementary arithmetic. The hard part is usually reading the specification correctly.
- **Silver** problems need a named technique: prefix sums, binary search, sorting, greedy choice, simple graph traversal.
- **Gold** problems need a correct algorithm under a tighter constraint, usually where the naive version is $O(n^2)$ and the input permits $O(n \log n)$, or where the graph is large enough that the constant factor of the representation starts to matter.
- **Platinum** problems need either a deeper idea, a data structure that supports the required operation, or a proof that the greedy step is safe.

These tracks are covered by the curriculum pages. The academy you are reading now is the layer underneath them: it is division-independent, and it exists so that the material in a Gold lesson is not the first time you meet a hash table.

## How the local progress record works

A.A.Y.N.T.N. tracks your reading in your own browser and nowhere else. The record is stored in IndexedDB, a database that lives inside the browser profile. There is no account, no server component, and no analytics script that observes which pages you open. Clearing your browser data destroys the record, and nothing can restore it.

At the end of a lesson you can set a status from four values: not started, in progress, review, or mastered. "Mastered" is a claim you make yourself after satisfying the review checklist on that lesson. Reaching the bottom of a page never marks it, because scrolling is not understanding.

Practice results are recorded by hand as well. A.A.Y.N.T.N. is a static site; it cannot run a hidden judge against code you paste into it, and the interface says so rather than pretending otherwise. You submit to the official judge, read the verdict, and record the outcome here.

Because the record lives only in one browser, moving it between machines requires the export and import pair on the progress page. Export produces a JSON file containing your statuses; import reads one back.

## How the code panels are organized

Reference implementations in A.A.Y.N.T.N. are real source files that live outside the documentation tree, one directory per algorithm, each with a manifest describing its language, its input contract, its complexity, and whether it has been compiled and run against the shared fixtures.

Pages do not paste that code by hand. They refer to it by identifier, and the theme inserts the right panel at build time:

- `<AlgorithmSummary algorithm="graphs.dijkstra" />` renders the at-a-glance panel: complexity, assumptions, required background, and the chip row that shows which divisions the technique belongs to.
- `<CodeViewer algorithm="graphs.dijkstra" />` renders the language tabs and the highlighted listing for each registered variant.
- `<AlgorithmPlayer algorithm="graphs.dijkstra" />` renders the interactive animation, driven by deterministic reference code rather than by random steps.

The identifiers are the whole contract. If a manifest does not exist for an identifier, the panel renders nothing and the page silently loses that section, which is why the academy pages do not use these components. There is no implementation manifest for academy material: the snippets in these parts are teaching examples written inline, not files the project compiles and tests.

Two other components are used throughout the academy. `<MathPanel>` gives definitions, lemmas, proofs, invariants, recurrences, counterexamples and complexity results a distinct visual treatment, so you can tell at a glance what kind of mathematical object you are reading. `<PrerequisiteGraph>` renders the dependency map that the build computes from the frontmatter of every lesson, so the picture always matches the data.

<PrerequisiteGraph focus="start.algorithm-analysis" />

## A workable rhythm

A pace that survives contact with a real school term is roughly one module per sitting. A module is one numbered section of one part file, and each one ends with a checkpoint that asks you three conceptual questions, two code-reading questions, one implementation exercise and one small applied problem.

The checkpoint is the unit of progress, not the page. You have understood a module when you can answer its conceptual questions without re-reading the section, and when the implementation exercise produces code that passes its own small test. If you cannot, re-read that module and try again rather than moving on. The material compounds: a hole in part 2 shows up as a confusion in part 4, and later as a wrong complexity claim in a contest.

Read the material, then close the page and reconstruct it from memory. Everything you cannot reconstruct is the part you did not understand. This is slower than highlighting text and considerably faster than re-reading everything twice.
