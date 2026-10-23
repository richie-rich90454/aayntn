# Contributing to A.A.Y.N.T.N.

**A.A.Y.N.T.N.** — _All Algorithms You Need to Know_ — is a static, Markdown-authored, mathematically rigorous encyclopedia of competitive programming, from AP Computer Science A proficiency through USACO Platinum and beyond.

This document is the contract between the editorial content, the executable implementations, and the build tooling. If you follow it, a new algorithm can be added without touching a single Vue component.

---

## 1. The three sources of truth

| Layer | Lives in | Canonical? |
| --- | --- | --- |
| Editorial content | `docs/**/*.md` | **Yes** — Markdown is the source of the prose |
| Executable code | `implementations/**`, `templates/**` | **Yes** — real source files in their own languages |
| Machine-readable metadata | YAML frontmatter, `algorithm.yaml`, `data/**/*.yaml` | **Yes** |
| Presentation | `docs/.vitepress/theme/**` | No — it renders metadata, it never contains content |
| Derived artifacts | `docs/.vitepress/data/generated/**`, `docs/public/**` | **No** — never edit these by hand |

The build regenerates everything derived. If you find yourself editing a file under `docs/.vitepress/data/generated/`, you are doing it wrong.

---

## 2. Repository layout

```
A.A.Y.N.T.N./
├── docs/                       VitePress site
│   ├── index.md                homepage (layout: false)
│   ├── start/                  prerequisite academy
│   ├── curriculum/             Bronze → Platinum tracks
│   ├── algorithms/             subject-based encyclopedia
│   ├── languages/              six language centers
│   ├── templates/              template library
│   ├── mathematics/            mathematical reference
│   ├── practice/               problem catalog page
│   ├── laboratory/             interactive demonstrations index
│   ├── progress/               local progress dashboard
│   ├── reference/              rules, checklists, glossary
│   ├── about.md
│   ├── public/                 published assets (fonts, search index)
│   └── .vitepress/             theme, config, generated data
├── implementations/            one directory per algorithm
├── templates/                  reusable contest templates, one directory per language
├── data/                       algorithms, curriculum, problems, synonyms, visualizations
├── diagrams/source/            handcrafted SVG sources, published by the build
├── tools/                      build-time validation and generation
├── tests/                      unit, differential, content and accessibility tests
└── .github/workflows/          CI
```

### Algorithm directory layout

```
implementations/<domain>/<algorithm>/
├── algorithm.yaml              manifest: metadata + one entry per variant
├── c/
│   ├── minimal.c
│   └── program.c
├── cpp17/
├── java/
├── python/
├── pascal/
└── javascript/
```

Only create a variant file that is genuinely useful. A recursive variant for an algorithm where recursion is not appropriate is worse than no variant at all; mark the variant `not-applicable` with a reason instead of inventing one.

---

## 3. Lesson frontmatter contract

Every lesson begins with validated YAML frontmatter. The schema lives in `tools/lib/schema.ts` and is enforced by `pnpm run validate`.

```yaml
---
id: graphs.dijkstra # unique, lowercase dotted segments
title: Dijkstra's algorithm
summary: Single-source shortest paths with nonnegative weights
division: [gold] # bronze | silver | gold | platinum
subjects: [graphs] # see the subject list below
level: intermediate # introductory | intermediate | advanced
importance: common-contest-technique
keywords: [shortest path, weighted graph, priority queue]
prerequisites:
    required: [graphs.representation, structures.priority-queue]
    recommended: [graphs.bfs]
complexity:
    time: "O((V + E) log V)"
    space: "O(V + E)"
assumptions:
    - Edge weights are nonnegative.
implementations: graphs.dijkstra # must match an algorithm.yaml `algorithm` id
visualization: graphs.dijkstra # must match a data/visualizations/*.yaml id
problems: [usaco.2019.dec.gold.flight]
reviewed: true
draft: false
---
```

**Subjects.** `foundations`, `enumeration`, `searching`, `greedy`, `arrays`, `range-queries`, `graphs`, `trees`, `dynamic-programming`, `strings`, `number-theory`, `combinatorics`, `geometry`, `advanced`.

**Importance** is independent of division: `core-prerequisite`, `common-contest-technique`, `advanced-technique`, `specialized-technique`, `extended-reference`. A technique can be a superb extension topic and still be rare in contests.

---

## 4. Implementation manifest contract

`implementations/<domain>/<algorithm>/algorithm.yaml`:

```yaml
algorithm: graphs.dijkstra
title: Dijkstra's algorithm
summary: ...
subject: graphs
divisions: [gold]
importance: common-contest-technique
prerequisites:
    required: [...]
    recommended: [...]
complexity:
    time: "O((V + E) log V)"
    space: "O(V + E)"
assumptions:
    - Edge weights are nonnegative.
visualization: graphs.dijkstra
reviewed: true
variants:
    - id: minimal
      language: cpp17
      file: cpp17/minimal.cpp
      kind: minimal # minimal | program | educational
      recommended: recommended # recommended | conditional | not-applicable
      reason: "Reusable function over an adjacency list; no I/O."
      time: "O((V + E) log V)"
      auxiliarySpace: "O(V + E)"
      status: verified # verified | unverified
      inputs: "..."
      outputs: "..."
      notes: "..."
      operations: [relax-edge, extract-min]
```

Rules that the validator enforces:

- `file` must exist, and must be inside the algorithm's own directory.
- `id` and `language` together must be unique inside the algorithm.
- `auxiliarySpace` must describe **the implementation you actually wrote**, not the textbook. An iterative DFS that marks a vertex only when popped can hold O(E) stack entries; say so.
- `status: verified` is only correct once `pnpm run validate:code` has compiled and run the file.

---

## 5. Code style

The generated listings must look like code a strong competitor would write, not like a tutorial with a comment on every statement.

**Comments explain decisions, invariants, and subtlety — not syntax.**

```cpp
// Good: explains a non-obvious invariant.
if (dist[u] + w < dist[v]) { ... }

// Bad: restates the code.
++i;   // Increment i by one.
```

For complex algorithms, the comments should identify the maintained invariant, the purpose of the data structure, a non-obvious transition, why an optimization is valid, and any overflow or memory-safety consideration.

**Do not present a truncated fragment as a complete program.** A `minimal` variant is a reusable function or data structure with a documented contract. A `program` variant parses input, calls the algorithm, and formats output. An `educational` variant adds explanation; if `minimal` already does that job, do not create a third file.

**Every implementation must:**

1. Be real, compilable code in the declared language and standard.
2. Document its input assumptions.
3. Match the mathematical behavior of the algorithm.
4. Handle empty and boundary cases where they can occur.
5. Use no library outside the language's standard library.
6. Have meaningful names and readable control flow.
7. Have a complexity statement that matches its actual data structures.
8. Pass the shared fixtures in `tests/fixtures/`.

### Language-specific requirements

| Language | Standard | Notes |
| --- | --- | --- |
| C | C11 | `-Wall -Wextra -Werror -fsanitize=address,undefined` in CI. Every allocation has a documented cleanup path. |
| C++17 | C++17 | Both a GCC `<bits/stdc++.h>` convenience template and a standards-compliant template are provided. |
| Java | Java 17 | Public class `Main` for judge submission; a `FastScanner` for large input. |
| Python | Python 3.6+ | No syntax newer than 3.6 in examples that claim to target the published judge version. |
| Pascal | Free Pascal 3.x | `program` mode, `{$mode objfpc}{$H+}`. Educational reference only. |
| JavaScript | Node.js 18+ | CommonJS. Educational reference only — never labeled a USACO submission solution. |

**USACO submission languages are C, C++, Java and Python.** Pascal and JavaScript are educational reference implementations and must be marked as such wherever they appear.

---

## 6. Article structure

A substantial algorithm article follows the order below. Small prerequisite lessons may be shorter, but they keep the teaching elements.

1. At a glance
2. Problem motivation
3. Recognition patterns
4. Naive approach
5. Key insight
6. Visual intuition
7. Formal model
8. Algorithm derivation
9. Step-by-step execution
10. Correctness proof
11. Complexity proof
12. Algorithm selection
13. Reference implementations
14. Recursion decision
15. Implementation walkthrough
16. Common mistakes
17. Variants and extensions
18. Contest strategy
19. Worked problems
20. Practice progression
21. Review checklist
22. Further reading

Mathematical objects get their own treatment with `<MathPanel>`:

```md
<MathPanel type="lemma" title="Lemma">
If the predicate is monotone, binary search returns the first index at which it holds.
</MathPanel>
```

Types: `definition`, `lemma`, `theorem`, `proof`, `invariant`, `recurrence`, `counterexample`, `complexity`.

The implementation viewer and the animation are inserted by identifier, not by hand:

```md
<AlgorithmSummary algorithm="graphs.dijkstra" />

<AlgorithmPlayer algorithm="graphs.dijkstra" />

<CodeViewer algorithm="graphs.dijkstra" />
```

---

## 7. Writing rules

- Sentence case for every title. No uppercase-only headings. No centered-dot separators.
- No serif interface fonts. No letterspacing on long paragraphs.
- One idea per paragraph. The reading measure is 68–76 characters.
- Never state a complexity bound without saying which implementation it assumes.
- Every proof names its claim, its assumptions, and the logical reason the result follows. "Obviously optimal" is not a proof.
- Show counterexamples. A wrong approach explained with the smallest counterexample is worth more than a paragraph of correct prose.
- Do not reproduce copyrighted problem statements or editorials. Link to the original and write your own explanation.
- Do not claim that a technique is "USACO-approved" or that a page is an official resource. A.A.Y.N.T.N. is an independent preparation resource.

---

## 8. Before you open a pull request

```bash
pnpm install
pnpm run generate      # regenerate indexes, highlighted code, search index
pnpm run validate      # schemas, identifiers, prerequisite DAG, links
pnpm run validate:code # compile and run every implementation
pnpm run check:links   # internal link resolution
pnpm test              # unit, differential and content tests
pnpm run build         # full static build
```

CI runs the same commands. A pull request that fails the build does not merge.

---

## 9. License

The project is licensed under **AGPL-3.0-only**. Original lessons, implementations and artwork are covered by it. Contributed code must be your own or compatible with it; the webfonts under `docs/public/fonts` are covered by the SIL Open Font License 1.1, and the manifest of every implementation records its license and provenance.

`A.A.Y.N.T.N.` is an independent preparation resource. It is not affiliated with, endorsed by, or supported by the United States of America Computing Olympiad. The names of the examinations, the competitions and the languages that appear in the material belong to their owners; see [TRADEMARKS.md](TRADEMARKS.md) for the detail.

---

## 10. The community files

These files are part of the repository and a pull request that touches them is reviewed against them like any other change.

| File | What it states |
| --- | --- |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | How people are expected to treat each other, and what happens when they do not, including the rules that are specific to a teaching project. |
| [SECURITY.md](SECURITY.md) | What a vulnerability can be in a static site, how to report one privately, and what the reader can expect. |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | The commitment, the environments that are supported, the limitations that are known, and how to report a barrier. |
| [SUPPORT.md](SUPPORT.md) | Where to ask, what to put in an issue, and how long it takes. |
| [TRADEMARKS.md](TRADEMARKS.md) | The names that belong to other people, the independence of the project, and the rules of a contest. |
| [README.md](README.md) | What the project is, and how to run it. |

A pull request that adds a lesson, a listing, a laboratory or a page must keep every promise those files make. In particular, a change that lowers the contrast of the text, that removes the statement of the situation in which a technique fails, or that reproduces a problem statement is a regression.

---

## 11. The shape of a commit

One file per commit, with a conventional subject and a body that says what the file does. The subject reads as a sentence about the repository:

```text
fix(algorithms): keep the identifier whole in a narrow cell
```

The body is a list of lines, each of which says one thing about the change:

```text
- Breaks a word only when it cannot fit on a line of its own, so that an
  identifier in a table keeps its name instead of being cut in two.
- Writes the word that names the accent with the accent token, so that a
  cobalt letter is legible on a dark page.
```

The reasons are worth writing down, because the next person to change the file is not the person who wrote the code. The history is the only record of why a rule exists, and this repository has rules that exist because something went wrong once.

The commits are in American English, like everything else here.

---

## 12. The two questions a reviewer will ask

**Is it true?** A bound that is stated in a lesson, in a listing and in a summary panel must be the same bound in all three. The complexity block in the frontmatter is checked against the article, and the six languages are checked against each other, byte for byte.

**Is it worth reading?** A lesson that a reader who is stuck can follow is worth more than a lesson that is merely correct. Every article derives the technique, states the situation in which it fails, and shows a counter example. If a contribution removes one of those, it needs a reason that is better than brevity.

Everything else — the prose, the formatting, the spelling, the appearance — is checked by machines, and a pull request that fails a check does not merge.
