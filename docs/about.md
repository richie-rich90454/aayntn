---
id: about
title: About this encyclopedia
summary: What this encyclopedia is for, the editorial standard it holds itself to, how it is licensed, and how it is built.
division: []
subjects: []
level: introductory
importance: extended-reference
keywords: [about, editorial standard, license, contribution, independence]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

A.A.Y.N.T.N. is an encyclopedia of competitive programming. It is not a course, and it will not assign your week or tell you which problem to attempt on Tuesday. It collects the body of competitive programming knowledge into one fixed order, with the proofs and the complexity arguments that most explanations quietly omit.

## What it is for

The knowledge a competitor needs is not large. It is a few dozen techniques, a handful of mathematical facts, and one way of reading a problem. The difficulty is not in the size of the material but in the order of it, in the proofs that make each technique trustworthy, and in the fact that most explanations of a technique stop before the part that explains why it works.

A.A.Y.N.T.N. exists to write those parts down, once, in an order that a reader can follow from a passing grade in AP Computer Science A to the harder end of the Platinum division. It is a reference that happens to be readable, not a curriculum that happens to be accurate.

The encyclopedia is deliberately explicit about the boundary of its own coverage. Every article states its complexity together with the implementation the bound assumes, every subject page ends with the list of techniques it implies and does not yet cover, and an article that has not been checked end to end is marked as unreviewed rather than presented as finished.

## The editorial standard

Every substantial article follows the same structure, listed in full in the contributing guide. The order is fixed so that a reader who has read one article knows where to look in the next.

**The mathematical treatment.** Every proof names its claim, its assumptions, and the logical reason the result follows. "Obviously optimal" is not accepted as a proof, and neither is a complexity bound without a statement of which implementation produces it. A formula that appears without the condition under which it holds is corrected rather than passed along.

**The implementation must be compiled and run.** An algorithm that ships as a reference implementation has a manifest, real source files in each language, and a fixture suite that the build executes before the site is published. The status of each implementation is recorded honestly: verified only once it has actually been compiled and run against the shared fixtures. Code that appears only inside prose is written to be read, and the encyclopedia does not claim that it compiles.

**An unfinished topic is marked as such.** There are two levels of completeness in the frontmatter of every article, and they mean what they say. A tested implementation means the technique has been compiled and run. A reviewed article means it has been checked end to end against the article contract: the section order, the mathematics, the complexity claims, and the worked problems. Everything else is accurate but unfinished, and the site says so.

**Nothing copyrighted is reproduced.** Problem statements and editorials belong to their authors. Where a problem appears here, it appears as a link to the original, with the explanation written separately.

## Independence

A.A.Y.N.T.N. is an independent preparation resource. It is not affiliated with, endorsed by, sponsored by, or supported by the United States of America Computing Olympiad, by the College Board, by any school, or by any teacher.

Nothing on this site is an official document, an official rule, or an official interpretation of a rule. The competition's rules belong to the competition, and the [official instructions](https://usaco.org/index.php?page=instructions) are the only statement of them. The [rules page](/reference/usaco-rules) summarizes them in the encyclopedia's own words, with a link to the original, and it says plainly that they must be re-read before every contest because they change.

## Names that belong to other people

The examination, the competition and the programming language names that appear in this material are the trademarks or the registered marks of their owners. They are used here only to identify the things they name: to say which examination the curriculum starts from, which competition the catalog links to, and which language a listing is written in. **No permission has been granted, and none is claimed, for their use as the mark of this project.**

The names concerned are those of the College Board, of the United States of America Computing Olympiad, of the ISO and IEC working groups that standardize C and C++, of Oracle America and Ecma International for Java and JavaScript, of the Python Software Foundation, and of the owners of the Noto typefaces, of VitePress, of KaTeX, of Shiki and of Playwright. The full list, with the way each name is used, is in `TRADEMARKS.md` in the repository.

The examination material is not reproduced. The curriculum follows the _content_ of the course because that is the starting point of many readers, and no examination, practice examination, rubric or scoring guideline is copied here.

## License and attribution

The project is licensed under **AGPL-3.0-only**. The original lessons, implementations, and artwork are covered by it.

Contributed code must be your own or compatible with that license. Every implementation manifest records its license and its provenance, so that the origin of any listing can be traced.

The webfonts under `docs/public/fonts` are covered by the **SIL Open Font License 1.1**, which is a separate and compatible license, and the license text ships alongside the fonts.

The competition names and the problem titles belong to their owners. They are used here to identify the sources of the problems, and no claim of ownership is made.

## How the site is built

The content is **Markdown**. Every editorial page is an ordinary Markdown file with YAML frontmatter, and the frontmatter is the machine-readable contract: the identifier, the title, the division, the subjects, the level, the prerequisites, and the review status.

A **build-time generator** reads the frontmatter, the implementation manifests, the problem records, and the visualization data, and writes the derived indexes: the lesson list, the prerequisite graph, the search index, the highlighted source listings, and the problem catalog. Derived artifacts are never edited by hand; changing them is a sign that something upstream was changed incorrectly.

The output is **static**. There is no backend, no server, no account, and no analytics script. The one piece of state a reader creates, the progress record, lives in the reader's own browser and can be exported and imported by hand.

The interactive demonstrations are driven by deterministic reference code rather than by random steps, so that an animation shows the same thing every time it is opened.

## Contributing

Contributions are welcome, and the contribution guide is the contract between the editorial content, the executable implementations, and the build tooling. It lives at `CONTRIBUTING.md` in the repository root, and it is the first file to read.

The guide specifies the frontmatter contract for every lesson, the manifest contract for every implementation, the code style expected in a listing, the article structure, the writing rules, and the commands that must pass before a change is accepted.

The repository is at `github.com/richie-rich90454/aayntn`. The short version of the process is: write the Markdown, put the code in `implementations` with a manifest, run the validation and the test suite, and open a pull request. The same commands run in continuous integration, and a pull request that fails the build does not merge.

Two things are worth knowing before you start. Every implementation must be real, compilable code in the language it claims to be, and it must pass the shared fixtures. And an article that claims more than it delivers is worse than a missing article, so an unfinished topic should be marked unfinished.
