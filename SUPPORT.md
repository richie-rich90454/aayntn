# Support

## Where to ask

| What you want | Where |
| --- | --- |
| A mistake in a lesson, a wrong bound, a broken link, a listing that does not compile | An issue on the repository |
| An idea for a lesson, a technique, or a laboratory | An issue on the repository |
| A barrier in the site for a person with a disability | An issue on the repository, labelled `accessibility` |
| A vulnerability | **Not** an issue. See [SECURITY.md](SECURITY.md) |
| A question about how to use the material | An issue on the repository, labelled `question` |
| A correction to a problem statement | An issue on the repository, labelled `lesson-error` |
| A question about the license | An issue on the repository |

The issue templates are in `.github/ISSUE_TEMPLATE`. The first one asks for the information that lets a maintainer reproduce what you saw.

## Before you open an issue

Three checks answer most of the questions that arrive:

1. **Is the answer already in the encyclopedia?** The technique pages carry a section on the situation in which the technique fails, and the reference carries the constants and the bounds. Search first: the search is in the header of every page.
2. **Does the problem show in the checks?** Run the full check locally:

    ```bash
    pnpm install
    pnpm run format:check
    pnpm exec tsc --noEmit
    pnpm run validate
    pnpm run check:links
    pnpm test
    ```

    If a check fails, the output names the file and the line. A pull request that comes with a failing check will not be reviewed until it passes, so running them first saves everyone a round trip.

3. **Is the problem about the material, or about the rules of a contest?** The rules of a competition are set by its organizers and change. Everything in this repository is preparation material. See [TRADEMARKS.md](TRADEMARKS.md).

## What a good issue contains

- **The page.** The address of the page, or the path of the file.
- **What you expected** and **what happened instead**. A wrong bound and a missing paragraph are different reports, and so are two different wrong bounds.
- **A way to reproduce it.** The input, the expected output, and the output you got, for anything that runs.
- **The toolchain**, for anything that does not compile: the language, the version, and the operating system.
- **The scope.** Whether it blocks you completely, or makes one part of the material hard to use.

## How long it takes

The project is maintained by one person, in the hours that are left over. A report of a wrong bound in a lesson is usually answered within a few days. A feature that would change the shape of the material takes longer, because it has to be argued rather than merely fixed.

If an issue has gone quiet, a short note asking whether it is still wanted is welcome. Silence is not a decision.

## Reporting a problem with a person, not with the code

Behavior that breaks the [Code of Conduct](CODE_OF_CONDUCT.md) is reported the same way, and it is handled by the ladder in that file, which is published so that you can see what will happen before you report.

## Contributing

If you would rather fix it yourself, [CONTRIBUTING.md](CONTRIBUTING.md) is the contract: the shape of a lesson, the shape of a listing, the rules of the prose, and the checks a pull request must pass.

## Accessibility

Barriers are reported the same way, with the label `accessibility`, and [ACCESSIBILITY.md](ACCESSIBILITY.md) states what the site promises, what it supports, and what it does not do yet.
