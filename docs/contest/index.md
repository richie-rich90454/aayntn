---
id: contest.overview
title: The contest simulation
summary: A rehearsal for a real contest, run against the clock in your own browser, with the solutions closed until the session ends.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [contest simulation, timed practice, contest strategy, verdicts, review]
prerequisites:
    required: []
    recommended: [start.contest-literacy]
reviewed: false
---

<script setup lang="ts">
import ContestSimulation from "../.vitepress/theme/components/practice/ContestSimulation.vue";
</script>

Contest solving is a different activity from practice solving, and the difference is not the mathematics. It is the budget. In practice you can look something up, you can try a problem four times, and you can stop for dinner. In a contest you get one attempt per problem, a fixed number of minutes, and a statement you have never seen before. The recognition skill you have built over months is either there or it is not, and the contest is the instrument that tells you which.

This page explains what a simulation is for, what a USACO contest actually looks like, what the published rules permit while the clock is running, and how to run a session here. The simulation itself is the component at the bottom of the page. It is deliberately austere: a division, a set of problems, a clock, a verdict for each problem, and a report at the end.

## Why simulate at all

Three things are hard to train without a clock.

**Reading a statement you have never seen.** Every problem in the practice catalog comes with a hint ladder, a discussion, and a list of techniques it exercises. A real statement gives you a title, an input format, an output format, and a constraint range, and it expects you to decide within a few minutes whether the problem is a prefix-sum problem, a shortest-path problem, or something you have not seen. Simulating strips the help away and leaves only the statement.

**Deciding what to skip.** A contest is not three problems solved in sequence. It is a triage. A competitor who spends ninety minutes on the hardest problem and has nothing for the other two has done worse than a competitor who abandons it at thirty minutes, banks two easy ones, and returns with time left. The simulation forces the decision, because the clock keeps running while you deliberate.

**Writing code without a safety net.** Under contest rules you may not consult an algorithm reference, and a compiler error costs you minutes you do not have. The only defense is having written the boilerplate before. A simulation lets you practice the shape of the session without the risk, which is why the [pre-contest checklist](/reference/contest-checklist) exists as a separate artifact.

A simulation is a rehearsal. It is not the event, and a good one is not scored by anybody but you.

## The shape of a USACO contest

Each USACO contest is a set of problems with a division attached. A competitor registers for one division and receives that division's problems, which are ordered from the easiest to the hardest. The published instructions state that a contest typically has three or four problems.

The time budget differs by division. Bronze competitors receive 75 minutes, and the Silver, Gold and Platinum divisions receive 120 minutes. Those are the defaults in the simulation, so a session run at the default limit reproduces the shape of the real event even when the problems are old ones. Read the published instructions yourself before you rely on the number, because the competition's own figures are the ones that count.

The problems are ordered by difficulty, and the ordering is a claim about the techniques involved. The first problem of a Silver contest is usually a direct application of something you have seen, the second usually needs a modification, and the third usually combines two things. The distribution of the practice catalog's problems follows the same convention, which is why the difficulty rating in the catalog is worth reading before you choose a set.

The promotion and demotion rules decide which division you sit in, and they are not worth simulating. What is worth simulating is the arithmetic of a single session: three problems, one attempt each, one clock.

## The rules that apply during a contest

The rules are the competition's, and they are summarized in full on the [rules page](/reference/usaco-rules). What matters for a simulation is the part about what you may consult while the clock runs.

**Permitted:** references covering basic language functionality, such as syntax, standard library functions, and input and output behavior.

**Not permitted:** consulting algorithm resources, using prewritten code or templates, and using generative artificial intelligence services. The published instructions name the last one explicitly.

The rules also constrain the program itself. It must be deterministic unless the statement says otherwise, and it must read only the input the task specifies and write only the output the task specifies. The memory limit is a constraint in exactly the way the time limit is, and the instructions name an allocation that is too large as a common cause of a run-time error on the grading server but not at home.

One rule has a direct consequence for this site. Submission must go through the interface on the competition's own website, and attempts to submit by other means, such as scripts that automate the process, are not permitted. That is why there is no submit button anywhere in this encyclopedia, and why the simulation records a verdict that you write down rather than a verdict that something fetches for you.

The rules are also why the solutions on this site are closed during a session. A simulation that let you read the discussion for the problem in front of you would not be a rehearsal of anything.

## How to run a session

The component below is the whole simulation. Here is the sequence, and the reasoning behind each step.

### 1. Pick the division

The division sets the default time limit, and it sets the pool of problems you draw from. Bronze is a good place to start if you have never run a session, because the problems are short and the techniques are simple, so the bottleneck is the clock rather than the idea. Silver is the natural target once Bronze is comfortable.

The division also determines the length of the run, which determines how long you need to be free. A Bronze session is seventy-five minutes. A Silver session is two hours. Pick the shorter one if you have an evening and a commitment the next morning.

### 2. Choose the problems

Every problem the catalog holds for the chosen division is listed, each labeled with the contest it was drawn from and with its difficulty. Check the boxes for the problems you want.

To rehearse a specific archived contest, check the three problems that share a contest name. The catalog does not group them for you, because the grouping is uneven, and a filter that returned one problem most of the time would be worse than no filter at all.

A USACO contest has three problems, so three is the natural number to check. Two is a reasonable choice for a first rehearsal, because two problems with time left over is a realistic outcome and it leaves room to look at a report while the session is still fresh. One is a warm-up rather than a simulation.

### 3. Start the clock and stop looking up

When you start, the timer begins. The current problem appears with a link to the statement at its original source, so you read it exactly as a contestant would: no hints, no technique labels telling you what to think, no discussion.

You may consult references about basic language functionality while you work, and you may not consult anything about the algorithm. That is the rule, and a simulation is the right place to notice that you have been leaning on an algorithm reference you did not realize you were leaning on.

### 4. Record a verdict per problem

The simulation records one of five outcomes for each problem: accepted, wrong answer, time limit exceeded, runtime error, or not attempted.

The distinction between the three failure verdicts matters more than it looks, because the three point at three different bugs. A wrong answer means the program ran to completion and produced something the judge did not want. A runtime error means the program did not run to completion, and the stack trace or the error message is a gift: it names the line. A time limit exceeded means the program ran and ran and never finished, which is a complexity problem or a constant factor problem and almost never a logic problem.

The difference between a wrong answer and a runtime error is the difference between a hypothesis and a fact. The wrong answer is a symptom; the runtime error is a location. The [debugging laboratory](/debugging/) is about how to turn the first into the second.

"Not attempted" is a verdict, not an absence. Marking a problem you deliberately skipped tells the report that the problem was in the session and was abandoned, which is a different fact from a problem you never opened. The report counts them separately.

The minutes spent on each problem are recorded with the verdict, which is what turns the session into something you can learn from. The number of minutes before the first verdict on a problem is the best single measure of how long your recognition took, and it is the number that separates a problem you recognized from a problem you wrestled with.

### 5. End the session and read the report

You may end the session at any time, and the clock ends it for you when the limit runs out. Either way, the solutions open.

The report gives you four numbers: how many problems you attempted, how many you solved, how many you did not attempt, and how many minutes you spent on the problems. It gives you the time spent per problem, which is the number to read first. It gives you a list of what to review next: every problem that was not accepted, with the techniques that problem exercises, linked to the article that derives those techniques.

That last list is the actual output of the session. Read the article for the technique, close the tab, and solve the problem again from scratch against the clock. A session that ends with five problems read and no problems re-solved has not finished its work.

## Reading the report well

The tempting thing to do after a bad session is to read every solution and feel informed. That is the wrong order. The informative order is:

1. Look at the time per problem. A problem that took long and was wrong is a recognition problem. A problem that took short and was wrong is an implementation problem. They are fixed by different things.
2. Read the discussion for the problems you got wrong, and only those. The discussion explains the technique, and the technique is what you were missing.
3. Look at the review list and follow the technique links. This is the same list the report generates, and it is ordered by the techniques you did not use.
4. Re-solve the failed problems against a fresh clock, without the discussion open.

If the report says you attempted three and solved one, then the two failures are the entire content of the next week, and the solved one is not what you should be studying.

## What this simulation cannot do

Stated plainly, because a practice tool that pretends otherwise is worse than no practice tool.

**There is no hidden judge.** The site is static. The component above cannot compile your program, run it, or compare its output against a reference answer. It has no server behind it and no account to log into.

**Submission happens at the real judge.** You submit your solution yourself, through the interface the competition provides, and you read the verdict there. The simulation records what you tell it.

**Nothing is submitted on your behalf.** The published contest rules require submission through the competition's own website and prohibit automating the submission process. A site that submitted for you would be breaking those rules in your name.

**The verdicts are your own.** They are stored in this browser, they are not verified against anything, and no competition recognizes them. Your history lives in the same place, and the [progress dashboard](/progress/) exports it to a portable file.

**The problems are old ones.** The catalog draws on archived contests, so you may already have seen a problem and its solution. A problem you remember is not a problem you recognized.

## Where to go next

The [practice catalog](/practice/) holds the full list of problems with their hint ladders, and the [contest checklist](/reference/contest-checklist) is the list to work through before a real contest. The [contest literacy chapter](/start/from-ap-csa/part-6-contest-literacy) covers how a contest is scored and how competitors are promoted between divisions. When a session ends badly, the [debugging laboratory](/debugging/) is where the verdict turns into a fix.

## The simulation

<ContestSimulation />
