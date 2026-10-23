# Accessibility

A.A.Y.N.T.N. is a reference work that a student reads at a desk, usually at night, usually while stuck. It is written to be read by a person, and to be read by a person who uses a keyboard, a screen reader, a magnifier, or a setting of their operating system that changes how every page looks.

This file states what the site promises, what it supports, what it does not do yet, and how to tell us when it falls short.

## Our commitment

We hold the site to **Web Content Accessibility Guidelines (WCAG) 2.2 at level AA**. That is a promise about measurable outcomes, and we check it with machines rather than with good intentions.

Concretely, the continuous integration of this repository fails a change when:

- **Any text on any page falls below the contrast ratio of the guidelines** against the field it stands on, in both the light appearance and the dark one. The measurement is of what the browser actually paints, so a panel placed on the wrong ground is caught as well as a color chosen too close to another.
- **Any page scrolls sideways** at any of five widths, from a phone to a screen wider than a desk.
- **Any element stands past the edge of the page**, which is how a cut-off column announces itself to a reader who magnifies the text.
- **The text loses its measure** — a column of the outline squeezing the body of the text into a ribbon.
- **The search control is pushed off the screen**, which would take away the only way into the encyclopedia.
- **A heading loses its blank line, a panel is never closed, or an identifier is broken in two** — the three mistakes that make a page unreadable to a machine as well as to a person.

## The features the site uses

- **Semantic structure.** Every page is a document with a title, a heading hierarchy, landmarks, and a skip link to the content. The order of the headings is the order of the ideas.
- **Text that is text.** The lessons are ordinary Markdown, so they can be read, copied, translated, and searched. The mathematics is rendered by KaTeX, which keeps the formula in the markup as well, so that a reader with a screen reader or a formula reader gets the expression and not a picture of one.
- **Keyboard operation.** Every control — the navigation, the search, the tabs of the language and the variants, the laboratory, the file input of the progress page — is reachable and operable from the keyboard. The visible focus is never removed.
- **A focus order that follows the page.** The order of the controls is the order in which they appear.
- **Labels on every control.** Every input, button and link has a name that a screen reader reads out, and the search control announces the name of the encyclopedia rather than the word "search".
- **States that are not only color.** The chosen tab, the chosen variant and the current heading in the outline are marked with an attribute as well as with a color, and every state has a contrast that stands on its own.
- **A responsive layout.** The page is one column on a phone, two on a tablet, and three on a desktop. The measure of the text stays between about sixty and eighty characters at every width, and no content is removed at any width.
- **A text size that is not locked.** The text is sized in relative units where it can be, and the browser's own settings for the default size and for a minimum size are honored.
- **Two appearances, both checked.** The dark appearance is not the light one with the lights turned off. It is a separate palette, with its own surfaces and its own rules, and every page is measured in both.
- **No motion that cannot be turned off.** The only motion is the demonstration in the laboratory, and it runs when the reader presses play and stops when the reader presses pause. Nothing moves on its own, and nothing flashes.

## The environments we support

| Environment | Support |
| --- | --- |
| Chrome, Edge, Firefox and Safari, current and previous major version | Supported |
| Safari on iOS and iPadOS, current and previous major version | Supported |
| Chrome on Android, current major version | Supported |
| Firefox on Android, current major version | Supported |
| Screen readers: VoiceOver on macOS and iOS, NVDA on Windows, JAWS on Windows, TalkBack on Android | Supported |
| The keyboard alone, without a pointing device | Supported |
| Windows High Contrast Mode and forced colors | Supported |
| Browser zoom to 400 percent | Supported |
| Reader mode | Supported, because the lessons are ordinary Markdown |
| Text-to-speech, with the mathematics read as an expression | Supported |

The site is a static set of files. It needs a browser from the last few years and nothing else: no plugin, no download, no application, no account.

## Known limitations

We state these plainly, because a limitation that is not stated is a limitation that a reader discovers on their own.

1. **The mathematics is rendered as an image of an expression.** KaTeX produces a picture of the formula and keeps the expression in the markup for the machines that can read it. A reader whose screen reader cannot read MathML will hear the surrounding words and not the formula itself. The prose around every formula states what the formula says, so the meaning is never carried by the formula alone.
2. **The laboratory is a picture with a narration.** The demonstration is drawn as SVG and the text beside it is a real paragraph. A reader who cannot see the drawing gets the narration, but not the picture. The narration is written to be complete on its own.
3. **The search index is a large file.** The index of the encyclopedia is about two hundred kilobytes and is fetched when the reader opens the search. On a slow connection that takes a moment, and the interface says so while it happens.
4. **The figures are static images.** The handcrafted diagrams of the ornaments and the decorations carry their meaning in an `aria-label`, but they are not described in prose the way a figure in a book would be.
5. **The tables are wide.** A table of five or six columns is wide, and on a phone it scrolls sideways inside its own panel rather than across the page. That is a deliberate choice: a table that wraps is a table that cannot be read.
6. **The dark appearance was measured, not designed by eye.** Every color in it was checked against the guideline, and the result is a palette that passes the measure. A reader who wants a different darkness, or a different hue for the accent, can change it in the settings of the browser, and the site honors the system preference for the appearance.

## How to report a barrier

**A barrier in the site itself is a bug, and we want it.** Open an issue with the label `accessibility` and describe what you were trying to do, what you expected, and what happened instead. The template in `.github/ISSUE_TEMPLATE` asks for the browser, the assistive technology and the page, because those three details usually make the difference between a report we can reproduce and one we cannot.

Please say which of the following it is:

- **A barrier** — something that stops a person from reading or using the site. These are treated as defects, and they are fixed in the order they are found.
- **A friction** — something that makes the site harder to use than it needs to be. These are fixed when the fix does not cost more than the friction does.
- **A difference of opinion** — a different way of doing something that the author did not think of. These are discussed, and they are often good ideas.

There is no separate address for accessibility. It is the same queue as every other issue, and an accessibility report is never closed as "working as intended" without a reply that says what was measured.

If a report concerns the repository's own files rather than the published site, the same applies.

## How we test

The site is measured by machines on every change, in continuous integration, and the measurements are in the repository:

- `tests/visual/legibility.spec.ts` measures the contrast of every word of a set of pages against the field it stands on, in both appearances.
- `tests/visual/pages.spec.ts` measures the layout of the reference pages at five widths in both appearances, and fails the change when a page scrolls sideways, when an element stands past the edge, or when the text loses its measure.
- `tests/accessibility/markdown.test.ts` checks the structure of the markup: the headings, the landmarks, the labels on the controls, and the components that a page may use.
- `tests/content/markdown-structure.test.ts` checks the structure of the Markdown itself, so that a page cannot be broken before it reaches the reader.

The checks are necessary and not sufficient. A measure cannot tell whether the order of the prose is the order a reader would want. If you find a barrier that no measure caught, that is a failure of our testing and not of yours, and the report is welcome.

## Standards

- [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/), level AA.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) for the patterns of the interface.
- The [ARIA in HTML](https://www.w3.org/TR/html-aria/) recommendations for the markup of the pages.
