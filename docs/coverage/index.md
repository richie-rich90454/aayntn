---
id: coverage.index
title: Coverage
summary: What the encyclopedia publishes, what its subject pages name as missing, and how every figure on this page is computed.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [coverage, completeness, missing techniques, corpus, tagging]
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

A reference that hides its gaps is not a reference. This page states what A.A.Y.N.T.N. publishes, what its subject pages name as missing, and what its corpus of problems has been tagged with. The figures are generated from `data/taxonomy.yaml` and `data/corpus/tasks.yaml`; the missing list is transcribed from the subject indexes.

## The claim

The encyclopedia publishes 78 technique articles across fourteen subjects. The subject pages name 81 further techniques that the subject implies but does not yet teach. Every technique in either set carries one status: `published` when its article exists, `missing` when a subject page names it and no article exists, and `beyond` when it is deliberately outside the scope. No technique is currently marked `beyond`. The missing list is therefore a promise of work, not a claim that the work is done.

Completeness is a stricter test than publication. A technique is complete only when its article exists and its implementation manifest is registered in `data/algorithms/registry.yaml`. On that definition, **{{ summary.complete }} of the {{ summary.required }}** techniques that the corpus exercises are complete, or **{{ coveragePercent(summary) }} percent**. The other {{ summary.required - summary.complete }} are published without the full contract, and they are counted here rather than quietly omitted.

## The figures

The corpus contains **{{ summary.totalTasks }}** tasks, and **{{ summary.taggedTasks }}** of them carry at least one technique tag, or **{{ taggingPercent(summary) }} percent**. The summary was last recomputed on {{ summary.updated ?? "an unrecorded date" }}.

<CoverageMatrix />

The division rows count a technique once per division in which the corpus uses it, so they do not sum to the global total. A technique can be required by a Bronze problem and a Platinum problem at the same time. The global figures are the ones the home page and the progress page read.

## The method

The numbers are only as trustworthy as the way they were produced, so the method is stated in full.

- **Official analysis first.** A task is tagged from the official editorial when one is published, and `evidence` records that editorial URL. When no editorial exists, or when the editorial does not discuss a technique the statement uses, the tag comes from our own reading and `evidence` is the literal `derived`. The two cases are never mixed silently.
- **The taxonomy is seeded, not remembered.** The published entries take their id, title, subject, and division from the frontmatter of the 78 articles. The missing entries are copied from the "What this subject implies but does not yet cover" section of each subject index. No technique is added from memory.
- **The corpus is one entry per problem.** Every file in `data/problems` produces exactly one entry in `data/corpus/tasks.yaml`, with the existing technique list preserved. Tagging a task appends an id from the taxonomy and refuses anything that is not in it.
- **The summary is computed, not edited.** `tools/coverage/summary.ts` rewrites `data/coverage-summary.json` from the taxonomy and the corpus. `tools/coverage/check.ts` fails on a duplicate id, an unknown technique or subject, or a summary that disagrees with a fresh computation. It does not fail on a missing article or an untagged task, because those are honest gaps rather than errors.
- **One reader, one set of figures.** The home page, the progress page, and this page read the summary through `useCoverage`. There is no second copy of the numbers to drift.

## The missing techniques

Every entry below is named by a subject index and has no article of its own. Where a subject page says the technique is derived inside another lesson, the link goes to that lesson. A link on the heading goes to the subject index that names the technique.

### [Foundations and complexity](/algorithms/foundations/)

- Amortized analysis
- Loop invariants
- [The proof techniques](/start/from-ap-csa/part-3-discrete-mathematics)
- The time-memory tradeoff

### [Enumeration and searching](/algorithms/enumeration/)

- Complete search as a subject
- Constraint propagation
- Gray codes
- Iterative deepening
- [Meet in the middle as its own article](/algorithms/enumeration/subset-enumeration)

### [Searching](/algorithms/searching/)

- The parametric search generalization
- [The sliding window variants with a state machine](/algorithms/searching/sliding-window)
- Search over a sorted range of indices
- [The individual two-pointer patterns](/algorithms/searching/two-pointers)

### [Greedy methods](/algorithms/greedy/)

- The exchange argument as a general tool
- Greedy with a feasibility oracle
- [The matroid perspective](/algorithms/advanced/)
- Sorting by several keys
- Scheduling with deadlines and release times

### [Arrays and sequences](/algorithms/arrays/)

- Prefix sums over other operators
- Range hashing
- Two-dimensional difference arrays

### [Range query structures](/algorithms/range-queries/)

- Implicit segment trees
- Lazy propagation
- Merge sort trees
- Mo's algorithm
- Persistent segment trees
- Segment tree beats
- Square-root decomposition
- Wavelet trees

### [Graphs and shortest paths](/algorithms/graphs/)

- The two-coloring test for a bipartite graph
- Dominator trees
- Floyd-Warshall and all-pairs shortest paths
- The Hungarian algorithm
- Johnson's algorithm
- Minimum cost flow

### [Trees and decompositions](/algorithms/trees/)

- Dynamic trees
- Small-to-large merging
- The top-tree and rake-compress formulation
- Tree hashing
- Virtual trees

### [Dynamic programming](/algorithms/dynamic-programming/)

- The aliens trick
- Divide-and-conquer optimization
- Knuth optimization
- The Li Chao tree
- [Monotonic queue optimization](/algorithms/arrays/monotonic-queue)
- Profile dynamic programming
- Subset transforms

### [Strings](/algorithms/strings/)

- Aho-Corasick
- The minimal rotation of a string
- Palindrome trees, also called the eertree
- String hashing of subsequences
- The suffix-array-based palindrome method
- The suffix automaton
- Suffix trees

### [Number theory](/algorithms/number-theory/)

- The discrete logarithm
- Euler's totient function and Euler's theorem
- The fast Fourier transform
- Miller-Rabin
- The number-theoretic transform
- Pollard's rho

### [Combinatorics](/algorithms/combinatorics/)

- Burnside's lemma
- The hook-length formula
- Integer partitions
- Multinomial coefficients and the hypergeometric distribution
- The reflection principle

### [Computational geometry](/algorithms/geometry/)

- Line arrangements and the half-plane intersection
- Integer geometry
- K-D trees
- Robust predicates
- The smallest enclosing circle
- The Voronoi diagram

### [Advanced algorithms and special techniques](/algorithms/advanced/)

- Berlekamp-Massey
- Bitset optimization
- Matroids
- Offline dynamic connectivity
- Persistent data structures
- Quickselect and randomized selection
- Randomized algorithms
- The rollback disjoint set union
- Game theory and Sprague-Grundy theory
- XOR bases

## The untagged backlog

There is none. Every one of the {{ summary.totalTasks }} tasks carries at least one technique. The tagger reports the backlog on demand:

```sh
pnpm exec tsx tools/coverage/tag.ts
```

An empty technique list is not a structural error. It is a gap, and the point of the corpus is to make it visible rather than to make the check fail.

## Where to go next

Browse the [algorithm encyclopedia](/algorithms/) to read what exists, follow a [curriculum track](/curriculum/) to decide what to learn next, or [download the static edition](/download/) to read offline.
