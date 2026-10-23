# Security policy

## The scope of this project

A.A.Y.N.T.N. is a set of static files. There is no server, no database, no account, and no backend. The site is served as plain HTML, CSS, and JavaScript, and the only state a reader has is what their own browser remembers.

That shape decides what a security issue can be here:

- There is **no authentication** to bypass, because there is no authentication.
- There is **no server-side code** to inject into, because the build turns Markdown into files and stops.
- There is **no data store** to exfiltrate, because nothing is collected.
- The **only code that runs** is the JavaScript that the browser loads from the site itself, plus the two webfonts that it loads from the same origin.

The risks that remain are therefore narrow: something in the published JavaScript, something in the published markup, a dependency that is compromised, or a link or an image that points somewhere it should not.

## Supported versions

The site is rebuilt from the main branch and published as a single artifact. There are no released versions and no long-term support branches, so there is nothing to keep patched. Security fixes land on `main` and are published by the deployment workflow.

| Version                                    | Supported |
| ------------------------------------------ | --------- |
| The `main` branch and the published site   | Yes       |
| Anything older than the latest publication | No        |

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use the private reporting form of the repository, which is the _Security advisories_ link on the repository's _Security_ tab, and mark the report as a security advisory. If the form is unavailable to you, open a regular issue that says only _"security report, please open a private channel"_ and no detail, and a maintainer will open the private channel for you.

Please include, as far as you can:

- The page or the file the problem is in, and the address of the page.
- What an attacker could do, and what they would need in order to do it.
- The steps to reproduce it.
- Whether the problem is already public anywhere.

### What to expect

| Stage | What happens |
| --- | --- |
| Acknowledgement | Within three working days. |
| First assessment | Within seven working days: whether it is a vulnerability, and how serious it is. |
| Fix and publication | A fix is published as soon as it is ready, together with an advisory that says what the problem was, how it was fixed, and how to tell whether a given copy of the site is affected. |
| Credit | Credit in the advisory, if you want it. |

If a report is not a vulnerability, you will be told so, with the reason, and the report will be handled as an ordinary bug if it is one.

## What is not a vulnerability

- The site is static, so there is no account to take over and nothing to steal. An attempt to log in is not a vulnerability; there is no login.
- A finding that needs an attacker to already control the origin is not a vulnerability of this project.
- The absence of a security header that does not apply to a static site is not a vulnerability. The deployment workflow sets the headers that a static site should set, and the site is served over HTTPS by the host.
- A typo, a wrong bound, a broken link, or an article that is hard to read is a bug, not a security problem. Please report those in the ordinary way: see [CONTRIBUTING.md](CONTRIBUTING.md).

## The dependencies

The build depends on the packages in `package.json`, and the site loads no third-party script at run time. Two habits keep the risk low, and both are enforced by the continuous integration:

- The lockfile is committed, and the build installs from it with `--frozen-lockfile`.
- The build and the checks run in continuous integration on every change, so a change that pulls in a package with a known advisory is visible in the log of the change that caused it.

The two webfonts under `docs/public/fonts` carry the SIL Open Font License 1.1, whose text ships beside the binaries.

## The privacy of the reader

The site sets no cookie, runs no analytics, and sends nothing to any third party. The progress dashboard, the search index, and the contest simulation all live in the reader's own browser.

Two things do leave the browser, both at the reader's request and both to the same origin that served the page: the search index is fetched when the reader opens the search, and a listing is fetched when the reader opens it. Neither carries anything about the reader.

The deployment is done by GitHub Pages, which keeps its own logs. The repository's privacy policy is the policy of GitHub, which governs the account and the access logs.

## The legal material

The problem statements are not reproduced here; the catalog links to them. The examination and competition names are the property of their owners. See [TRADEMARKS.md](TRADEMARKS.md) for the details.
