---
id: reference.usaco-rules
title: USACO rules and eligibility
summary: Which languages are accepted, what may be consulted during a contest, and when to re-read the official instructions.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [USACO, rules, eligibility, submission languages, contest integrity]
prerequisites:
    required: []
    recommended: [start.contest-literacy]
reviewed: false
---

This page summarizes the published contest instructions for the United States of America Computing Olympiad, in the encyclopedia's own words. It does not reproduce the official text, and it is not a substitute for it. The official instructions are at [usaco.org/index.php?page=instructions](https://usaco.org/index.php?page=instructions), and they were last checked on **21 October 2026**.

**The rules are the competition's.** They belong to the competition, they change, and they are sometimes changed between one contest and the next. Re-read the official instructions before every contest. The summary below is a convenience, and a convenience is not an authority.

## Which languages are accepted for submission

The published instructions state that each contest typically has three or four problems, to which you submit solution programs in **C, C++, Java, or Python**.

Two consequences follow, and both matter.

**Pascal support has been discontinued.** The official instructions say so explicitly. No Pascal program can be submitted to a current contest. The Pascal center in this encyclopedia is therefore educational reference material: it exists so that you can read an algorithm expressed in Pascal, and so that the ideas behind the other implementations are visible from more than one direction.

**JavaScript is not among the listed languages.** Nothing in the published instructions offers it as a submission option. The JavaScript material in this encyclopedia is educational reference material for the interactive demonstrations and for readers who want to see the same algorithm in a scripting runtime. No program written in JavaScript should ever be described to a judge as a submission solution.

The instructions also describe the toolchain used for each accepted language, including the compiler versions, the optimization flags, and the interpreter versions offered for Python. The exact versions are not reproduced here, because they change. Read them from the official instructions, and match your local environment to them before a contest.

## What you may consult during an active contest

This is the part of the rules that is most often misunderstood, so it is worth stating carefully.

The published instructions say that the contest environment is meant to mimic the environment at the International Olympiad in Informatics, where all code must be written from scratch and the only references you may consult are those describing the syntax or library functions of your programming language.

In practical terms:

- **Permitted:** references covering basic language functionality, such as syntax, library functions, and input and output behavior.
- **Not permitted:** consulting algorithm resources during the contest.
- **Not permitted:** using pre-written code or templates to get a head start on your coding.
- **Not permitted:** using generative artificial intelligence services, which the instructions name explicitly as prohibited.

The instructions also state that work must be done individually rather than in a team environment, that consultation about the contest problems with anyone other than the contest director is prohibited, and that sharing technical information or code pertaining to a contest while it is running is prohibited.

The penalty is stated in the instructions as permanent removal from all USACO activities, and the instructions also note that cheating offenses are followed up with schools. This is not a rule you weigh against the value of a contest.

**The practical consequence for preparation.** Learn the algorithms now, and write the code now, while no contest is running. Learn your language's library functions well enough that you do not need to look them up mid-contest. Then the contest contains nothing but the problem in front of you, which is exactly what the rules intend.

## How input and output are delivered

Older problems use a **file-based** convention. The problem statement names an input file and an output file, and the program must open exactly those names. The instructions note that the file name is case-sensitive, that a complete path must not be given, and that if a problem uses file input and output, output written to standard output or standard error is not graded.

Since the **December 2020 contest**, the contest tasks have generally used **standard input and standard output**. The instructions state this directly: as of the December 2020 contest, input and output switched from file-based to terminal-based. The input and output specification of a problem states which mode is being used, so read it every time rather than assuming.

Both forms are shown side by side in the [template library](/templates/), with the file-based form using `example.in` and `example.out`. An archived problem may specify different file names, and the specification is the authority.

The instructions also describe the line-ending convention, which is a quiet source of local-only failures: the judging environment is a Unix environment, so lines are terminated with a single newline rather than a carriage return followed by a newline, and the last line of the input and of the output should also end with a newline. The instructions name a missing final newline as the most common reason a program that works locally fails on the contest server.

## What a program is permitted to do

The instructions constrain the program itself, not only the competitor.

- The program must be less than 100,000 bytes and must compile within the stated time.
- The memory limit is about 256 MB unless a problem states otherwise, and allocating too much memory is named as a common cause of a run-time error on the grading server but not at home.
- The program must be deterministic unless a problem says otherwise, and produce identical answers on identical input. Random-based programs are permitted with a fixed seed.
- The program must read only the input the task specifies and write only the output the task specifies, and must not open unrelated data files or create temporary files.
- The program must not pause and wait for a keypress, which the instructions note may produce an error such as an empty output file.
- Programs that consist of nothing more than print statements may be disqualified, and repeated submissions of print-only programs to reverse-engineer the inputs are explicitly forbidden.
- Submission must be done through the interface on the competition's own website. Attempts to submit by other means, such as scripts that automate the process, are not permitted.

That last rule is the reason this site is a static encyclopedia and never submits anything on your behalf. Aayntn has no backend, no account, and no judge. You submit to the official judge yourself.

## Eligibility and participation

The instructions state that all are welcome to participate in the online contests and the training system, that there is never any fee, and that only pre-college students in the United States are eligible for selection as finalists to attend the training camp and to contend for membership on the teams representing the United States at the International Olympiad in Informatics and the European Girls' Olympiad in Informatics.

Participants begin in the bronze division and are promoted as they score well, with the criteria varying from contest to contest. The instructions describe the promotion in principle and note that the details change.

## The summary to carry into a contest

- Submit in **C, C++, Java, or Python**. Pascal is discontinued, and JavaScript is not a submission language.
- Consult only references about **basic language functionality**. No algorithm resources, no prewritten templates, no generative AI.
- Read the **input and output specification** of each problem, and use standard input and output unless it says otherwise.
- Write code **from scratch**, keep the program deterministic, and submit it through the competition's own interface.

And once more, because it is the part that gets forgotten: **the official instructions are at [usaco.org](https://usaco.org/index.php?page=instructions), and they must be re-read before every contest, because they change.**
