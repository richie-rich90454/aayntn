# The article contract

Every algorithm article in aayntn follows one structure, so that knowing one algorithm tells the reader how to read the next one. This document is the contract; `docs/algorithms/searching/binary-search.md` is the worked exemplar that satisfies it.

## Frontmatter

```yaml
---
id: graphs.dijkstra
title: Dijkstra's algorithm
summary: Single-source shortest paths in a graph whose edge weights are all nonnegative.
division: [gold]
subjects: [graphs]
level: intermediate
importance: common-contest-technique
keywords: [shortest path, nonnegative weights, priority queue, greedy]
prerequisites:
    required: [graphs.representation, structures.priority-queue]
    recommended: [graphs.bfs]
complexity:
    time: "O((V + E) log V)"
    space: "O(V + E)"
assumptions:
    - Every edge weight is nonnegative.
implementations: graphs.dijkstra
visualization: graphs.dijkstra
reviewed: false
---
```

The field set is exactly these fourteen keys. `id`, `implementations` and `visualization` are fixed by the algorithm registry and must match it. A lesson that has no implementation omits `implementations`, `visualization` and `complexity`, and does not use the code viewer or the laboratory.

**Prerequisites may only reference these lesson ids**, because an unknown reference fails the build:

```
foundations.complexity            foundations.recursion
foundations.sorting               foundations.binary-representation
enumeration.subset-enumeration     enumeration.backtracking
searching.binary-search           searching.two-pointers
searching.sliding-window          greedy.interval-scheduling
arrays.prefix-sums               arrays.two-dimensional-prefix-sums
arrays.difference-arrays          range-queries.fenwick-tree
range-queries.segment-tree         range-queries.sparse-table
graphs.representation             graphs.dfs
graphs.bfs                        graphs.dsu
graphs.dijkstra                   graphs.0-1-bfs
graphs.bellman-ford               graphs.topological-sort
graphs.mst                        trees.lca
trees.heavy-light-decomposition    trees.tree-dp
dynamic-programming.0-1-knapsack  dynamic-programming.longest-increasing-subsequence
strings.kmp                       number-theory.modular-arithmetic
combinatorics.binomial-coefficients  geometry.convex-hull
advanced.parallel-binary-search
start.computational-foundations    start.algorithm-analysis
start.discrete-mathematics        start.data-structures
```

## Section order

Use these as `##` headings, in this order. The build checks that an article which declares an implementation contains all of them.

1. At a glance
2. Problem motivation
3. Recognition patterns
4. Naive approach
5. Key insight
6. Visual intuition
7. Formal model
8. Algorithm derivation
9. Step-by-step execution
10. Correctness proof
11. Complexity analysis
12. Algorithm selection
13. Reference implementations
14. Recursion decision
15. Implementation walkthrough
16. Common mistakes
17. Variants and extensions
18. Contest strategy
19. Worked problems
20. Practice progression
21. Review checklist
22. Further reading

An article without an implementation may use a shorter order, but it must still teach: motivation, recognition, the key insight, a formal model, a correctness argument, the complexity, the common mistakes, the contest strategy and a review checklist.

## Components

```md
<AlgorithmSummary algorithm="graphs.dijkstra" />

<AlgorithmPlayer algorithm="graphs.dijkstra" />

<CodeViewer algorithm="graphs.dijkstra" />
```

- `AlgorithmSummary` reads the manifest and shows the complexity, the assumptions and the prerequisites.
- `AlgorithmPlayer` shows the interactive demonstration. Its identifiers are the algorithm identifiers themselves; only the registered ones work.
- `CodeViewer` shows the six implementations with the language and the variant selectors, the recommendation, the verification status and the raw source.

An article must not use a component with an identifier that is not registered. `structures.priority-queue` and similar names are lesson ids, not component identifiers.

## Mathematical panels

```md
<MathPanel type="definition" title="Definition">
A predicate $P$ on the indices is **monotone** if there is an index $k$ such that
$P(i)$ is false for every $i < k$ and true for every $i \ge k$.
</MathPanel>
```

The types are `definition`, `lemma`, `theorem`, `proof`, `invariant`, `recurrence`, `counterexample` and `complexity`. Give every panel a `title`. Keep ordinary inline mathematics in the prose rather than forcing it into a panel.

## Writing rules

These are checked by the test suite, not merely by convention.

- **American English only.** The repository rejects `behaviour`, `colour`, `analyse`, `initialise`, `optimise`, `centre`, `catalogue`, `artefact`, `licence`, `grey`, `practise`, `modelling`, `labelled`, `travelling`, `cancelled`, `whilst`, `amongst`, `judgement` and the rest of that family. Use `behavior`, `color`, `analyze`, `initialize`, `optimize`, `center`, `catalog`, `artifact`, `license`, `gray`, `practice`, `modeling`, `labeled`, `traveling`, `canceled`, `while`, `among`, `judgment`.
- Sentence case for every heading. No uppercase-only headings.
- No centered dot separators. No emojis.
- One idea per paragraph, around 68 to 76 characters of reading measure.
- KaTeX with `$...$` inline and `$$...$$` for display. Every expression must compile.
- Comments in code listings explain the decision, never the syntax.
- Every factual claim must be correct. When a bound depends on a condition, state the condition.

## What an article must teach

- A concrete problem that makes the technique necessary, with its constraints.
- What to notice in a problem statement, and the constraint values that rule the technique in or out.
- A derivation, not an assertion: the state, the update, and why the update is correct.
- A formal model and a correctness argument with real reasoning. "It obviously works" is not a proof.
- A complexity analysis that accounts for the data structures the code actually uses.
- A "Why this fails" passage with the smallest counterexample that breaks a plausible wrong approach.
- A recursion decision, with a language-specific recommendation, because the call-stack limit differs between C++, Java, Python, Pascal and JavaScript.
- Worked problems: restatement, constraints, the naive baseline, the insight, the derivation, the correctness argument, the complexity, a common wrong approach.
- A practice progression in six stages: recognition, direct application, adaptation, combination, challenge, transfer.
- A review checklist of at least eight questions, each naming the section that answers it.
- Further reading that links only to pages that exist.
