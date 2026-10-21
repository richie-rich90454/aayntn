---
id: practice.overview
title: The practice catalog
summary: A structured problem catalog with a progressive hint ladder, worked solutions written here, and a contest simulation you run on your own machine.
division: []
subjects: []
level: introductory
importance: common-contest-technique
keywords: [practice, problems, hints, contest simulation, progress]
prerequisites:
    required: []
    recommended: [start.contest-literacy]
reviewed: false
---

Practice is where the encyclopedia stops being a book. The theory is written down; the theory is only learned by writing programs against problems that were not designed to make the theory look easy.

This page explains what the practice system contains, how the hints work, how the six stages of a progression are meant to be used, and how to run a contest simulation on your own machine.

## What the catalog contains

Every problem in the catalog is a record with structured metadata rather than a paragraph of prose. The fields are the ones a competitor actually needs to decide whether to attempt a problem:

- **Title and source**, with a link to the original problem. The statement is never reproduced here.
- **Division**, the competition division the problem is drawn from.
- **Difficulty**, a rating from one to five.
- **Techniques**, the named methods the problem is designed to exercise. These are the identifiers used by the encyclopedia's own articles, so a technique entry is a link into the derivation of that technique.
- **Prerequisites**, the lessons that should be read before the problem is attempted.
- **Special constraints**, the conditions that make this problem harder than its division would suggest: an unusual limit, a required technique, a trap.
- **Estimated minutes**, which is a rough guide and not a promise.
- **Hints**, the progressive ladder described below.

## Worked solutions, written here

Every problem that carries a discussion has one, and the discussion is written by this encyclopedia. It is not reproduced from an editorial that someone else owns, and it is not a copy of a solution posted elsewhere. Where the problem has an editorial, the record links to it, and the encyclopedia's own explanation stands separately.

This is a rule, not a preference. The contributing guide states it plainly: do not reproduce copyrighted problem statements or editorials, link to the original and write your own explanation. A solution that was worked out by reading the encyclopedia is worth more than one that was copied, because the first one leaves you knowing why the algorithm works.

## The progressive hint ladder

Each problem carries a ladder of hints, and the catalog reveals them one at a time. The first hint is deliberately small: it restates the problem in the vocabulary of the technique and asks the question you should be asking yourself. The second narrows the approach. The last is close to a solution sketch.

Two rules govern the ladder.

**No hint jumps to the solution.** A hint that names the data structure and gives the algorithm and its complexity is a solution, and reading it teaches you nothing except that you could not find the technique. The hints move from recognition to approach to implementation detail, and they stop short of the code.

**The ladder is only worth walking if you have tried.** A hint you read after twenty minutes of a genuine attempt is worth a great deal. A hint you read before you have written anything is worth almost nothing, because the twenty minutes were the learning. Close the page, or open a different tab, and come back.

The catalog below reveals each hint on click, one at a time, and remembers where you were.

## The six stages of a progression

Every technique in the encyclopedia carries a practice progression with six stages. The stages are ordered by what is being trained, not by difficulty.

**1. Recognition.** The problem is a direct instance of the technique, and the only task is to notice it. You are being trained to see the signal: the phrase in the statement, and the constraint value that selects the method.

**2. Direct application.** The technique applies, and the work is executing it correctly. The bug you will make here is an implementation bug, not a conceptual one, and the checkpoint is that your code passes your own test.

**3. Adaptation.** The technique applies with a modification: a different range, a different query type, an extra condition. The modification is what separates people who know a technique from people who have used it.

**4. Combination.** Two techniques are needed, and neither alone is sufficient. This is where a Silver solution becomes a Gold solution, and where the constraint values stop being decisive.

**5. Challenge.** The technique applies, but the constraints rule out the obvious implementation. You must find the constant factor, the offline transformation, or the tighter bound.

**6. Transfer.** The problem does not name the technique and does not look like it. You must reach for it from the shape of the problem rather than from a signal. At this stage the technique is a tool you own rather than a fact you recall.

Most people stop at stage 2 and believe they have learned the technique. The difference between a competitor who can solve Silver problems and one who can solve Gold problems is usually stages 3 and 4.

## Contest simulation mode

The catalog also supports running an archived contest against the clock, and the mode is deliberately austere.

1. **Choose a division and an archived contest.** Pick from the problems the catalog lists for that division.
2. **Run a local countdown.** The timer runs in your browser. It is not connected to any server, and nothing is submitted anywhere by starting it.
3. **View the problem links.** The statements are opened at their original source, so you read them exactly as a contestant would.
4. **Record the results by hand.** When you are done, write down what you solved, what you attempted, and what the verdict was. Writing it down is what makes the attempt worth doing; an attempt that leaves no record is an attempt you will make again next month.
5. **Read the solutions only afterwards.** The discussion for each problem is there, and it should be read after you have committed to an answer, not before.

The point of the mode is that a contest is a different activity from practice. In practice you can look things up, take as long as you like, and try a problem three times. In a simulation you get one attempt per problem and a fixed budget, which is the condition under which your problem recognition actually gets tested.

## What this site cannot do

Stated plainly, because a practice site that pretends otherwise is worse than no practice site.

**The site is static, and it cannot run a hidden judge against code you paste into it.** There is no server behind these pages. The code you write is not sent anywhere, not compiled by anything, and not compared against a reference answer. Nothing on this page runs your program.

**Submission happens through the legitimate external judge.** You submit your solution to the official judge yourself, using the interface the competition provides, and you read the verdict there. The catalog links to the original problems and to the official judge; that is where the submission happens.

**This site never submits anything on your behalf.** The official contest instructions prohibit submitting by any means other than the interface on the competition's own website, and they prohibit attempts to automate the submission process. A site that submitted for you would be violating those rules on your behalf, which is why there is no such feature and why there never will be one.

**The results you record are your own.** The progress record on the [dashboard](/progress/) holds what you type in. It is stored in your browser, it is not verified against anything, and it is not a score that any competition recognizes.

## The catalog

<PracticeCatalog limit="24" />

A note on what is in the list. The entries are ordered by their position in the generated data, not by difficulty, and the limit above shows the first twenty-four. Narrow the list with the division and technique filters in the interface when you want a specific set.

If the catalog is empty for a filter you expect, that filter has no problems registered against it yet. That is a gap in the data rather than a bug in your search.
