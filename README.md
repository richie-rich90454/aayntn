# A.A.Y.N.T.N.

**All Algorithms You Need to Know** — a complete, mathematically rigorous encyclopedia of competitive programming, from AP Computer Science A proficiency through USACO Platinum and beyond.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE) [![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-0b6b4a.svg)](ACCESSIBILITY.md) [![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-contributor%20covenant-blue.svg)](CODE_OF_CONDUCT.md) [![Security policy](https://img.shields.io/badge/security-policy-1f883d.svg)](SECURITY.md) [![Last commit](https://img.shields.io/github/last-commit/richie-rich90454/aayntn.svg)](https://github.com/richie-rich90454/aayntn/commits/main)

[![Validate](https://github.com/richie-rich90454/aayntn/actions/workflows/validate.yml/badge.svg)](https://github.com/richie-rich90454/aayntn/actions/workflows/validate.yml) [![Build and deploy](https://github.com/richie-rich90454/aayntn/actions/workflows/deploy.yml/badge.svg)](https://github.com/richie-rich90454/aayntn/actions/workflows/deploy.yml) [![Printable edition](https://img.shields.io/badge/printable%20edition-A4%20PDF-c63d32.svg)](https://richie-rich90454.github.io/aayntn/download/) [![Coverage](https://img.shields.io/badge/coverage-published-2847b8.svg)](https://richie-rich90454.github.io/aayntn/coverage/)

**Read it at [richie-rich90454.github.io/aayntn](https://richie-rich90454.github.io/aayntn/).** The whole encyclopedia is also a single A4 PDF, printed at five language presets, with bookmarks and page numbers: **[take it offline](https://richie-rich90454.github.io/aayntn/download/)**.

The site is a set of static files. Every lesson is an ordinary Markdown file, every implementation is a real source file in the language it claims to be, and every interactive demonstration is driven by a deterministic TypeScript reference implementation rather than by hand-drawn animation.

## What is in the box

- **A prerequisite academy** that fills the gap between AP Computer Science A and rigorous algorithmic problem solving: the execution model, complexity analysis, discrete mathematics, data structures, the language transition and contest literacy.
- **A subject-based algorithm encyclopedia** with a derivation, a formal model, a correctness proof, a complexity analysis, a counterexample, worked problems and a review checklist for every technique.
- **Six real implementations** of every algorithm — C, C++17, Java, Python, Pascal and JavaScript — each compiled and executed by the test suite, and each required to agree byte for byte with the other five.
- **An interactive laboratory** in which a reference implementation emits an event trace and a pure SVG scene renders it, so the picture cannot drift away from the mathematics.
- **A template library**, a **mathematical reference**, a **problem catalog** with progressive hints, and a **local progress dashboard** that needs no account.

## Reading order

1. **[Start from AP Computer Science A](/start/from-ap-csa/)** if that is where you are, or **[how to use A.A.Y.N.T.N.](/start/)** if you want the map.
2. **[The curriculum](/curriculum/)** gives four guided tracks from Bronze to Platinum.
3. **[The encyclopedia](/algorithms/)** is organized by the idea behind a technique rather than by the contest it appeared in.
4. **[The laboratory](/laboratory/)** shows the algorithms running.
5. **[The templates](/templates/)** and **[the reference](/reference/)** are the preparation desk.

## Independence and integrity

A.A.Y.N.T.N. is an independent preparation resource. It is **not** affiliated with, endorsed by, sponsored by, or supported by the United States of America Computing Olympiad, by the College Board, by any school, or by any of the organizations whose names appear in the material. The examination, the competition and the language names are the property of their owners and are used only to identify the things they name. See [TRADEMARKS.md](TRADEMARKS.md).

The published contest instructions currently accept **C, C++, Java and Python** as submission languages. **Pascal support has been discontinued** and **JavaScript is not among the listed languages**, so the Pascal and JavaScript listings in this repository are educational reference implementations and are marked as such everywhere they appear.

The contest instructions also restrict what may be consulted during an active contest: only references covering basic language functionality are permitted. Algorithm references, prewritten templates and generative AI are not. Everything here is preparation material. Check the official instructions before every contest, because they change.

## Running it locally

```bash
pnpm install
pnpm run generate      # rebuild the indexes, the highlighted source and the search corpus
pnpm run dev           # serve the site with hot reload
pnpm run build         # produce the static site in docs/.vitepress/dist
```

The complete check, which is what continuous integration runs:

```bash
pnpm run format:check  # the repository is formatted with oxfmt
pnpm exec tsc --noEmit # the theme, the laboratory and the tools are type checked
pnpm run validate      # schemas, identifiers, the prerequisite graph, the mathematics
pnpm run check:links   # every internal link resolves
pnpm run validate:code # compile and run every implementation in every language
pnpm test              # the unit, differential and content tests
```

`pnpm run validate:code` needs a C compiler, a C++17 compiler, a JDK, Python and Node. It reports Free Pascal as skipped when `fpc` is not installed, and the continuous integration job installs it so that every published listing is verified.

## The repository

```
docs/              the site: Markdown lessons, the theme, the generated data
implementations/   one directory per algorithm, with one file per language
templates/         reusable contest preparation patterns
data/              the algorithm registry, the curriculum tracks, the problem
                   catalog and the search synonyms
diagrams/source/   the handcrafted SVG sources, published by the build
tools/             the build-time generators and validators
tests/             the unit, differential, content and accessibility tests
```

Read **[CONTRIBUTING.md](CONTRIBUTING.md)** for the contract: the frontmatter schema, the manifest format, the code style rules and the list of checks a pull request must pass.

## The authoring model

Three rules keep the encyclopedia maintainable.

1. **Markdown is the canonical form of the prose.** A lesson is never a component.
2. **The canonical form of an algorithm is its source file.** A listing is never embedded in a lesson, and the source is compiled and run.
3. **The visualization is generated by the algorithm.** A demonstration is produced by a trusted reference implementation that emits a trace; the scene renders the trace. The two cannot disagree.

## License

Licensed under **AGPL-3.0-only**. The original lessons, the implementations and the artwork are covered by it. The webfonts under `docs/public/fonts` are Noto Sans and Noto Sans Mono, licensed under the SIL Open Font License 1.1, whose text ships beside the binaries.

Third-party problem statements and editorials are **not** reproduced here. The catalog links to the original statements and the worked solutions are written independently.

## Names that belong to other people

The examination, the competition and the language names that appear in the material are the property of their owners. They are used here only to identify the things they name, and no permission has been granted for their use as the mark of this project. **A.A.Y.N.T.N. is not affiliated with, endorsed by, or supported by** the College Board, the United States of America Computing Olympiad, or any of the other owners named above.

Everything here is preparation material. The rules of a contest are set by its organizers and change, and they usually prohibit algorithm references, prewritten templates and generative AI during an active contest. Read the official rules before every contest.

The detail is in **[TRADEMARKS.md](TRADEMARKS.md)**.

## The community

|  |  |
| --- | --- |
| [Contributing](CONTRIBUTING.md) | The contract: the shape of a lesson, the shape of a listing, the rules of the prose, and the checks a pull request must pass. |
| [Code of conduct](CODE_OF_CONDUCT.md) | How people are expected to treat each other, and what happens when they do not. |
| [Security policy](SECURITY.md) | How to report a vulnerability privately, and what to expect. |
| [Accessibility](ACCESSIBILITY.md) | The commitment, the supported environments, the known limitations, and how to report a barrier. |
| [Support](SUPPORT.md) | Where to ask, and what to put in an issue. |

Every one of these is part of the repository, and a change that breaks a promise made in one of them does not merge.
