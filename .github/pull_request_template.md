<!--
  Every pull request answers the questions below. The list is short because
  the contract in CONTRIBUTING.md is the long one, and a pull request that
  follows it needs nothing else.
-->

## What this changes

<!-- One or two sentences. A reader should be able to tell what is different
     without reading the diff. -->

## The kind of change

- [ ] A new lesson or a new technique
- [ ] A correction to an existing lesson
- [ ] An implementation, in one or more of the six languages
- [ ] The laboratory, a visualization, or a template
- [ ] The theme, the design, or the accessibility of the site
- [ ] The tooling, the checks, or the continuous integration
- [ ] The documentation, the community files, or the license

## The contract

- [ ] The prose is in American English, and it is written for a reader who is stuck rather than for one who already knows the answer.
- [ ] Every technique states the situation in which it fails, and the constraints that decide whether it is the right one.
- [ ] A lesson that names a bound states the same bound as the listing and as the summary panel.
- [ ] A listing is a real source file. It compiles, it runs, and it produces the same output as the other five languages.
- [ ] The frontmatter, the manifest and the complexity block follow the schema.
- [ ] The change does not remove content, and it does not remove a statement that a technique fails in some situation.

## The checks

<!-- The output of the checks is the evidence. Paste the lines that say the
     checks pass, and say which ones you ran. -->

```text
format:check
tsc --noEmit
validate
check:links
test
```

- [ ] The full check passes locally, and the output is pasted above.
- [ ] The change is formatted with `pnpm run format`.
- [ ] Nothing in the repository was written by hand that the generator writes. The generated files are not committed.

## The appearance

- [ ] The change was looked at in the light appearance and in the dark one.
- [ ] The change was looked at at the width of a phone and at the width of a wide screen.
- [ ] The text of the change is legible against the field it stands on, in both appearances.

## Screenshots

<!-- If the change is what a reader sees, a picture of the page before and
     after is worth more than a paragraph. -->

## Anything a reviewer should know

<!-- The part that is unusual, the part that is not finished, the part you
     are unsure about. Saying it here is much better than having a reviewer
     find it. -->
