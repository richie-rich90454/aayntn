---
id: changelog
title: Changelog
summary: What changed, in the order it changed, read from the commit history when this build was made.
division: []
subjects: []
level: introductory
importance: extended-reference
keywords: [changelog, changes, history, releases]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

<script setup lang="ts">
import ChangelogList from "../.vitepress/theme/components/changelog/ChangelogList.vue";
</script>

Every change to the encyclopedia is one commit and one file, with a conventional subject line. This page is generated from that history when the site is built, so it cannot fall behind the repository.

<ChangelogList />

## How to read a row

The kind names what changed: `feat` adds something a reader can use, `fix` repairs something that was wrong, `test` adds a check, `docs` changes a document, `refactor` changes the shape without changing the behavior, and `chore` is housekeeping. The scope names the part of the project, such as `navigation`, `design` or `coverage`.
