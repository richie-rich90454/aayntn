---
id: progress.overview
title: The progress dashboard
summary: A reading and practice history that lives in your own browser, with no account, no server, and no analytics.
division: []
subjects: []
level: introductory
importance: extended-reference
keywords: [progress, dashboard, history, export, import, browser storage]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

The dashboard records what you have read and what you have solved. It is the one part of A.A.Y.N.T.N. that keeps state, and the fact that it keeps state at all is unusual for a static site, so it is worth explaining exactly where that state lives and what it means.

## The history lives in your browser

Everything the dashboard shows is stored in your own browser, in a database called IndexedDB that lives inside your browser profile. There is no account. There is no server component. There is no analytics script that observes which pages you open.

The practical consequences follow from that design rather than being policy statements on top of it:

- **Clearing your browser data destroys the record.** Nothing on any server holds a copy, so there is nothing to restore it from.
- **Your record is not visible on your other devices.** A second computer, a second browser profile, and a phone each keep their own separate history.
- **Nobody else can see what you have read.** Not the authors, not the competition, not anyone.

## Three states, and what they mean

The dashboard distinguishes three states for a lesson, and the distinction is the important part.

**Read.** You have opened the lesson and worked through it. This is the weakest state, and it is what the dashboard marks automatically once you have visited the page. It is a statement about your attention, not about your understanding.

**Practiced.** You have attempted the problems attached to the lesson and recorded the outcome, whether solved or not. This state is entered by hand, because the site cannot compile or run anything you write.

**Mastered.** You have claimed mastery yourself, after satisfying the review checklist at the end of the lesson. **Mastery is never inferred from a page visit.** The site has no way to know whether you understood a lesson, and it does not pretend to. Reaching the bottom of a page marks nothing beyond the fact that you reached the bottom.

This is deliberate. An automated signal of mastery would be a number that looks meaningful and is not, and it would replace the only thing that actually works, which is the reader deciding honestly whether the material is understood. The checklists at the end of each lesson are written so that the decision has something to be based on.

<LearnNext />

## Export and import

Two buttons sit at the bottom of the dashboard, and they are the only way to move your history between devices.

**Export** writes a JSON file containing every status you have recorded, for every lesson and every problem, along with the version of the format. The file is portable and readable, and it is a snapshot: exporting twice without changing anything produces the same history.

**Import** reads such a file back and replaces the local record with its contents. The import is a replacement rather than a merge, so an accidental import of an old snapshot will roll your history back to that point. Export before you import if the current state matters.

**This is the only way to move the history between devices.** There is no cloud sync, no account, and no cross-device link. If you want the same record on a laptop and on a desktop, export from one and import into the other, and keep the exported file somewhere you will find it.

## The dashboard

<ProgressDashboard />

Two notes on what you will see there.

The lessons panel lists every lesson in the encyclopedia with a selector for its status, and the bars at the top count how many you have read and how many you have claimed to have mastered. The practice panel counts the problems you have attempted and solved.

Both counts are exactly what you entered them to be. The site does not verify them, and it does not compare them against any external record, because there is no external record to compare them against.
