---
id: download
title: Take the encyclopedia offline
summary: The printable book, its five language presets, the language card, and what the contest rules permit you to consult.
division: []
subjects: []
level: introductory
importance: extended-reference
keywords: [download, book, pdf, print, language card, offline, usaco rules]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

The encyclopedia can be read as one document, printed as a book, and carried to a desk with no network. This page describes the files, how they were made, and the one rule that decides which of them may be open during an active contest.

## The book

The book is a single self-contained HTML document containing every lesson in reading order. It is generated from the same Markdown as the site, with the same formulas and the same code listings, and it is the source of every PDF below.

<a href="/book/">Open the book</a>

The page has two sets of controls at the top. The language chooser shows only the code for the languages you select. The section chooser removes whole parts of the book, so a reader who is working on graphs can print the foundations, the graph material and the reference desk without the rest. Both controls are ordinary checkboxes; nothing is uploaded and no account is involved.

## The five presets

The PDFs differ only in which language listings they contain. Every other chapter is identical.

| Preset | Languages in the code listings | File |
| --- | --- | --- |
| C++17 | C++17 | [aayntn-book-cpp17.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-book-cpp17.pdf) |
| C++17 and Java | C++17, Java | [aayntn-book-cpp17-java.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-book-cpp17-java.pdf) |
| C++17 and Python | C++17, Python | [aayntn-book-cpp17-python.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-book-cpp17-python.pdf) |
| C, C++17 and Java | C, C++17, Java | [aayntn-book-c-cpp17-java.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-book-c-cpp17-java.pdf) |
| All six languages | C, C++17, Java, Python, Pascal, JavaScript | [aayntn-book-all.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-book-all.pdf) |

The PDFs are A4, print in color or in grayscale, carry a running header and a page number, and include bookmarks for every chapter. They are generated with Playwright from the book page, not from the site, so the reading chrome of the website never appears in the printed document.

## Printing from the browser

If you want a different combination from the five presets, print the book page yourself.

1. Open <a href="/book/">the book</a> in a browser.
2. Select the languages you want to read and the sections you want to keep.
3. Choose the browser's print command and save the result as a PDF. The page is already styled for A4 paper, with the navigation hidden, code blocks kept on one page, and links printed with their addresses.

The browser route is also the way to print a single subject. Remove every section except the one you are studying, print it, and the result is a booklet for that subject alone.

## The language card

[aayntn-language-card.pdf](https://github.com/richie-rich90454/aayntn/releases/latest/download/aayntn-language-card.pdf) is a two-page A4 card. It contains only the six starting templates from [the template library](/templates/): C, C++17, Java, Python, Pascal and JavaScript. Each program shows the language syntax, how it reads its input, and how it writes its output.

The card exists for the one thing that is allowed to be at the desk during a contest: a reference to the basic functionality of the programming language you are using.

## The rule that governs all of this

**During an active contest, algorithm resources and pre-written templates may not be consulted.** USACO permits a reference covering the basic functionality of the programming language, and nothing more. The book and the language sheets are revision material, for reading before the contest, not during it. **Only the language card is a permitted reference.**

That distinction is worth stating plainly because it is easy to violate by accident. A tab left open on an algorithm article is an algorithm resource. A saved copy of a starting template is a pre-written template, even if you typed it yourself last week. The book and the language sheets are preparation: read them, practice from them, and close them before the clock starts.

Read [the rules as this encyclopedia states them](/reference/usaco-rules) and the current rules published by USACO before every contest. The rules can change, and the organization's own statement is the only authority.
