---
id: curriculum.overview
title: The curriculum
summary: Four division tracks that turn the subject encyclopedia into a route, and an honest account of what a track does and does not promise.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [curriculum, tracks, divisions, study order, bronze, silver, gold, platinum]
prerequisites:
    required: []
    recommended: [start.from-ap-csa]
reviewed: false
---

The curriculum is four tracks: Bronze, Silver, Gold, and Platinum. Each one lists the techniques a competitor should meet in that division, in the order that makes them easiest to learn, with a link to the article that teaches each one.

The tracks exist to answer a question the subject encyclopedia cannot. The encyclopedia is organized by idea, which is the right way to understand a technique and the wrong way to decide what to learn on Saturday morning. The tracks are a route through the material.

## What the four tracks emphasize

| Track | The core idea | The techniques it turns on |
| --- | --- | --- |
| [Bronze](/curriculum/bronze/) | Get the specification right, then try everything | Simulation, complete enumeration, elementary arithmetic, recursion |
| [Silver](/curriculum/silver/) | Replace the double loop with a named technique | Sorting, binary search, prefix sums, greedy choice, the first traversals |
| [Gold](/curriculum/gold/) | Find the right state, and choose the right structure | Shortest paths, trees, dynamic programming, range structures, counting |
| [Platinum](/curriculum/platinum/) | Make the right solution expressible, then optimize it | Decompositions, offline techniques, DP optimization, special structures |

Each track page opens with what the division rewards, lists the techniques in order, and states what you should be able to do at the end of it. Read the track page before the subject page when you are deciding what to study next.

## The recommended order

The order is Bronze, then Silver, then Gold, then Platinum, and the order is not negotiable.

Bronze is not a warm-up. A Silver problem that you misread is a Silver problem you fail, and the misreading costs exactly as much as a wrong algorithm. The Bronze track is about the discipline of reading a specification and turning it into code that does what the words say.

Silver is where the named techniques appear. Almost every Silver problem is a problem whose quadratic solution needs to be replaced by a specific, well-known improvement. The skill being built is recognition: seeing that a statement asks for a prefix sum rather than a scan.

Gold is where the state and the structure appear together. A Gold problem usually has a quadratic solution that is not quite fast enough, and the fix is either a better state, a different traversal, or a data structure that makes the required operation cheap. It is the first division where you must choose the algorithm, not merely recognize it.

Platinum is where the solution has to be assembled from parts, and where the constraint has been chosen specifically to rule out the direct approach. The techniques are more specialized and the problems are longer, and the difference between a qualifier and a finalist is usually one structural idea applied in the right place.

You can skip ahead in one direction only. A competitor who can already write a correct $O(n \log n)$ solution can start at Gold, and a competitor who has already placed in Gold can read Platinum directly. Nobody should skip Bronze, because the failures there are the failures that repeat in every later division.

## How the tracks relate to the encyclopedia

The tracks and the subject pages are two views of the same material, and they are linked in both directions.

Every technique on a track links to the article that teaches it, and that article names the subject it belongs to. The subject pages then link back to the tracks. The result is that you can enter either way: by choosing a division and following its list, or by choosing an idea and following its subject page.

The difference between the two organizations is worth keeping in mind. A subject page groups techniques by the idea they share, which is what makes the derivation of one transfer to the next. A track groups techniques by the difficulty of the problems they appear in, which is what makes the study order sensible. A technique can appear on several tracks, because the same technique appears at several difficulties.

## What a track does not promise

A track is a guide, not a guarantee, and three things follow from that.

USACO does not publish a fixed syllabus. There is no official list of the techniques a Silver problem may use and the techniques a Gold problem may not. The divisions are defined by the difficulty of the problems, and the difficulty comes from the problem setter, not from a rule about which algorithms are allowed. Any list of techniques is therefore an interpretation, and this one is an interpretation by an independent preparation resource.

Techniques cross division boundaries. A greedy choice solves some Silver problems and appears in a Platinum problem as one line of a larger argument. Binary search appears from Silver upward and never stops. Range structures appear in Silver problems that do not need them and in Gold problems that do. A division is a statement about a whole problem, not about a technique.

The tracks are curated rather than official. They are one person's reading of what is worth learning in what order, built from the way the techniques depend on each other rather than from a list of past problems. They are not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad, and completing one of them does not predict a placement.

The honest way to use a track is as a default order, checked against your own recent failures. If you keep failing Silver problems by misreading them, you have a Bronze problem. If you keep failing by not knowing a technique, the track tells you which one to go and read.

## Where the tracks start

If you have never written a contest solution, the tracks assume the material in the [academy](/start/), and [From AP Computer Science A](/start/from-ap-csa/) is the bridge into it. If you can already write a program that reads input and produces output, the Bronze track may be enough of a beginning on its own.
