---
id: strings.index
title: The Strings
summary: Find a pattern inside a text, and prove that the search never looks at a character it does not need to look at.
division: []
subjects: [strings]
level: intermediate
importance: common-contest-technique
keywords: [strings, pattern matching, kmp, prefix function, substring search]
prerequisites:
    required: []
    recommended: []
reviewed: false
---

Strings is the subject of problems about text: finding a pattern in a text, comparing two texts, or transforming one into another. The hard part is not reading the characters. It is proving that a match search never examines more than a constant number of characters per position.

The naive string search compares the pattern against every position of the text, and in the worst case it compares the whole pattern at every position, which costs $O(nm)$ for a text of length $n$ and a pattern of length $m$. The techniques in this subject remove that quadratic factor by keeping what has already been matched, and the later ones in the subject go further and build a structure over the whole text so that the questions are not of the form "does this pattern occur" at all.

## The techniques in this subject

| Technique | Time | Space | Prerequisite | Article |
| --- | --- | --- | --- | --- |
| Knuth-Morris-Pratt | $O(n + m)$ | $O(m)$ | `foundations.complexity` | [KMP](/algorithms/strings/kmp) |
| Rolling hash | $O(n)$ to build, $O(1)$ per substring query | $O(n)$ for the two tables | `foundations.binary-representation` | [Rolling hash](/algorithms/strings/rolling-hash) |
| The Z function | $O(n)$ to build, $O(n + m)$ for a search | $O(n)$ | `strings.kmp` | [The Z function](/algorithms/strings/z-algorithm) |
| Suffix array | $O(n \log n)$ | $O(n)$ | `foundations.sorting` | [Suffix array](/algorithms/strings/suffix-array) |
| Trie | $O(L)$ per word | $O(N)$ nodes, plus one pointer per alphabet symbol per node when the children are stored densely | `foundations.binary-representation` | [Trie](/algorithms/strings/trie) |
| Manacher's algorithm | $O(n)$ | $O(n)$ | `strings.kmp` | [Manacher's algorithm](/algorithms/strings/manacher) |

The Knuth-Morris-Pratt algorithm is the one to learn first, because the prefix function it builds is the idea that every other string algorithm here reuses in some form. The failure function answers a single question: when a match breaks at position $i$, how much of the pattern is still matched?

The Z function answers the same question from the other direction, by measuring the match between each suffix and the whole string, and the two arrays carry the same information. The rolling hash trades exactness for speed: it replaces the comparison with a fingerprint, in constant time, at the price of a collision probability that the reader has to reason about.

The last three rows are not pattern matching at all. The suffix array sorts the suffixes, which answers the longest common substring and a family of counting questions. The trie shares the common prefixes of a set of words, which is what a dictionary problem needs. Manacher's algorithm computes the radius of every palindromic substring at once.

Two of the bounds need a word of explanation. The rolling hash costs $O(n)$ in space, not $O(1)$, because the tables of prefix hashes and powers are what make a single query constant time. The trie costs $O(N)$ nodes plus the cost of the children, and the alphabet factor is what decides whether a dense representation fits in memory.

## Recognition signals

- **"find the first occurrence"**, **"does the text contain"**, **"count the occurrences"**, **"find all positions where"**.
- **"a substring"**, **"a contiguous block of characters"**, **"the pattern"**. The word "substring" distinguishes the problem from the subsequence problem, which is a different and harder question.
- **"$n$ and $m$ both at $10^5$ or $10^6$"**, where a naive search would be $O(nm)$ and therefore too slow. This is the constraint that forces the subject.
- **"periodicity"**, **"the string repeats"**, **"the borders of the string"**, **"the longest proper prefix that is also a suffix"**.
- **"compare two substrings quickly"**, **"are these two blocks equal"**. That is a rolling hash, and the decision to use one or to use the suffix array is a decision about whether a collision is acceptable.
- **"the longest common prefix"**, **"the longest common substring of two texts"**, **"the longest repeated substring"**. That is a suffix array.
- **"a dictionary"**, **"autocomplete"**, **"words starting with"**, **"insert these strings"**. That is a trie.
- **"palindrome"**, **"reads the same backward"**, **"the longest palindromic substring"**. That is Manacher's algorithm, and the constraint that forces it is $n \ge 10^5$.
- **"match the characters of"**, **"these two strings describe the same thing"**, where the comparison ignores order. That is a multiset comparison, and it is a counting problem rather than a matching problem.

The signal that rules the subject out is a question about a subsequence rather than a substring. "Is this sequence a subsequence of that one" is solved by dynamic programming in $O(nm)$ and is not a pattern-matching problem.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| One pattern, one text, find the first occurrence | [KMP](/algorithms/strings/kmp) |
| One pattern, many texts | [KMP](/algorithms/strings/kmp), with the pattern's prefix function computed once |
| Many patterns, one text | [Aho-Corasick](/algorithms/strings/aho-corasick) |
| Compare two substrings in constant time | [Rolling hash](/algorithms/strings/rolling-hash) |
| The longest common prefix of two suffixes | [The Z function](/algorithms/strings/z-algorithm) or a [suffix array](/algorithms/strings/suffix-array) |
| The longest common substring of two texts | [Suffix array](/algorithms/strings/suffix-array) |
| The longest common substring of many texts | [Suffix array](/algorithms/strings/suffix-array) |
| Insert and look up whole words, and list the words with a prefix | [Trie](/algorithms/strings/trie) |
| The longest palindromic substring | [Manacher's algorithm](/algorithms/strings/manacher) |
| Every palindromic substring, and their count | [Manacher's algorithm](/algorithms/strings/manacher) |
| Two texts, decide whether they are permutations of each other | Count the characters and compare the counts |
| A text and a pattern of length one | A single scan, no technique needed |
| The pattern is short and the text is short | The naive search is fine, and it is the reference implementation |

The last row matters more than it looks. The [KMP article](/algorithms/strings/kmp) uses the naive search as the reference implementation, exactly as the [binary search article](/algorithms/searching/binary-search) uses the linear scan, because a disagreement between the two is the fastest way to find the bug.

## Every technique in this subject

<!-- aayntn:subject:start -->

| Technique | Time | Space | Prerequisite | Article | Source |
| --- | --- | --- | --- | --- | --- |
| Aho-Corasick | O(26L + n) for a lowercase alphabet | O(26L) for the transitions, where L is the total pattern length | `strings.trie` | [Aho-Corasick](/algorithms/strings/aho-corasick) | [Source](/implementations/strings-aho-corasick/) |
| Knuth-Morris-Pratt | O(n + m) | O(m) | `foundations.complexity` | [Knuth-Morris-Pratt](/algorithms/strings/kmp) | Prose only |
| Palindrome trees (eertree) | O(n) | O(n) | `foundations.complexity` | [Palindrome trees (eertree)](/algorithms/strings/palindrome-tree) | [Source](/implementations/strings-palindrome-tree/) |
| Rolling hash | O(n) to build, O(1) per substring query | O(n) for the two tables | `foundations.complexity` | [Rolling hash](/algorithms/strings/rolling-hash) | Prose only |
| String hashing of subsequences | O(n + q) for one string and q queries | O(n) for the prefix, suffix and power tables | `foundations.complexity` | [String hashing of subsequences](/algorithms/strings/subsequence-hashing) | [Source](/implementations/strings-subsequence-hashing/) |
| Suffix array | O(n log n) | O(n) | `foundations.sorting` | [Suffix array](/algorithms/strings/suffix-array) | Prose only |
| Suffix trees | O(n^2) for the published quadratic construction; O(n) for both answers after the build | O(n) nodes with 27 child slots each | `strings.trie` | [Suffix trees](/algorithms/strings/suffix-tree) | [Source](/implementations/strings-suffix-tree/) |
| The Manacher algorithm | O(n) | O(n) | `foundations.complexity` | [The Manacher algorithm](/algorithms/strings/manacher) | Prose only |
| The minimal rotation of a string | O(n) | O(1) beyond the input string | `foundations.complexity` | [The minimal rotation of a string](/algorithms/strings/minimal-rotation) | [Source](/implementations/strings-minimal-rotation/) |
| The suffix automaton | O(26n) for a lowercase alphabet | O(26n) for the transition table | `strings.trie` | [The suffix automaton](/algorithms/strings/suffix-automaton) | [Source](/implementations/strings-suffix-automaton/) |
| The suffix-array-based palindrome method | O(n log n) | O(n log n) | `strings.suffix-array` | [The suffix-array-based palindrome method](/algorithms/strings/suffix-array-palindrome) | [Source](/implementations/strings-suffix-array-palindrome/) |
| The Z algorithm | O(n) to build, O(n + m) for a search | O(n) | `foundations.complexity` | [The Z algorithm](/algorithms/strings/z-algorithm) | Prose only |
| Trie | O(L) per word | O(N) nodes, plus one pointer per alphabet symbol per node when the children are stored densely | `foundations.complexity` | [Trie](/algorithms/strings/trie) | Prose only |

<!-- aayntn:subject:end -->

## Related subjects

- [Searching](/algorithms/searching/) contains the general idea behind the binary search on the answer, which the string algorithms often use.
- [Range query structures](/algorithms/range-queries/) appear in the suffix array construction, which sorts a list of strings by repeated prefix comparison.
- [Dynamic programming](/algorithms/dynamic-programming/) solves the subsequence problems that this subject deliberately leaves aside.
- [Foundations](/algorithms/foundations/) supplies the binary representation, since string algorithms are often implemented over an array of integers rather than over characters.
- The [academy](/start/) introduces the substring and the subsequence as two different questions, and [From AP Computer Science A](/start/from-ap-csa/) is the route into it.
