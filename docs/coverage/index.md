---
id: coverage.index
title: Coverage
summary: What the encyclopedia publishes, how its coverage and corpus are measured, and how every figure is computed.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [coverage, completeness, corpus, tagging]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

<script setup lang="ts">
import CoverageMatrix from "../.vitepress/theme/components/coverage/CoverageMatrix.vue";
import {
    coveragePercent,
    taggingPercent,
    useCoverage,
} from "../.vitepress/theme/composables/useCoverage";

const summary = useCoverage();
</script>

A reference that hides its gaps is not a reference. This page states what A.A.Y.N.T.N. publishes, what its corpus of problems has been tagged with, and how each figure is computed. The figures come from `data/taxonomy.yaml`, `data/corpus/tasks.yaml`, and `data/coverage-summary.json`.

## The claim

The encyclopedia names **{{ summary.techniques }}** techniques across fourteen subjects. **{{ summary.published }}** are published and **{{ summary.missing }}** are missing. Every subject page lists every technique in its subject, with a link to the article and, where one exists, the reference implementation.

Completeness is a stricter test than publication. A technique is complete only when its article exists and its implementation manifest is registered in `data/algorithms/registry.yaml` under the same id. On that definition, **{{ summary.complete }} of the {{ summary.required }}** techniques that the corpus exercises are complete, or **{{ coveragePercent(summary) }} percent**. The other {{ summary.required - summary.complete }} are published without a registered manifest of their own, and they are counted here rather than quietly omitted.

## The figures

The corpus contains **{{ summary.totalTasks }}** tasks, and **{{ summary.taggedTasks }}** of them carry at least one technique tag, or **{{ taggingPercent(summary) }} percent**. The summary was last recomputed on {{ summary.updated ?? "an unrecorded date" }}.

<CoverageMatrix />

The division rows count a technique once per division in which the corpus uses it, so they do not sum to the global total. A technique can be required by a Bronze problem and a Platinum problem at the same time. The global figures are the ones the home page and the progress page read.

## The method

The numbers are only as trustworthy as the way they were produced, so the method is stated in full.

- **Official analysis first.** A task is tagged from the official editorial when one is published, and `evidence` records that editorial URL. When no editorial exists, or when the editorial does not discuss a technique the statement uses, the tag comes from our own reading and `evidence` is the literal `derived`. The two cases are never mixed silently.
- **The taxonomy is seeded from the articles.** Every published entry takes its id, title, subject, and division from the frontmatter of an article. No technique is added from memory.
- **The corpus is one entry per problem.** Every file in `data/problems` produces exactly one entry in `data/corpus/tasks.yaml`, with the existing technique list preserved. Tagging a task appends an id from the taxonomy and refuses anything that is not in it.
- **The summary is computed, not edited.** `tools/coverage/summary.ts` rewrites `data/coverage-summary.json` from the taxonomy and the corpus, including the publication figures on this page. `tools/coverage/check.ts` fails on a duplicate id, an unknown technique or subject, or a summary that disagrees with a fresh computation. It does not fail on an untagged task, because an untagged task is an honest gap rather than a structural error.
- **One reader, one set of figures.** The home page, the progress page, and this page read the summary through `useCoverage`. There is no second copy of the numbers to drift.
- **Every technique is on a page.** The generator that writes the subject tables refuses to finish if a technique article is missing from the subject page that should carry it. The content tests check the same invariant.

## The published techniques

There is no missing list. Every technique that the encyclopedia names has an article. The [algorithm encyclopedia](/algorithms/) is the complete index, and each subject page repeats its own complete table with the reference implementation where one exists.

The publication figure and the completeness figure measure different things. All {{ summary.published }} named techniques have an article, and {{ summary.algorithms }} of them also have a registered algorithm with source listings in six languages. The completeness figure counts only the techniques that the corpus exercises and that have a manifest registered under the same id, which is why it is smaller than the publication figure.

## The untagged backlog

There is none. Every one of the {{ summary.totalTasks }} tasks carries at least one technique. The tagger reports the backlog on demand:

```sh
pnpm exec tsx tools/coverage/tag.ts
```

An empty technique list is not a structural error. It is a gap, and the point of the corpus is to make it visible rather than to make the check fail.

## Where to go next

Browse the [algorithm encyclopedia](/algorithms/) to read what exists, follow a [curriculum track](/curriculum/) to decide what to learn next, or [download the static edition](/download/) to read offline.
