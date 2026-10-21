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

The naive string search compares the pattern against every position of the text, and in the worst case it compares the whole pattern at every position, which costs $O(nm)$ for a text of length $n$ and a pattern of length $m$. The techniques in this subject remove that quadratic factor by keeping what has already been matched.

## The techniques in this subject

| Technique          | Complexity | Prerequisite             | Article                        |
| ------------------ | ---------- | ------------------------ | ------------------------------ |
| Knuth-Morris-Pratt | $O(n + m)$ | `foundations.complexity` | [KMP](/algorithms/strings/kmp) |

The Knuth-Morris-Pratt algorithm is the one to learn first, because the prefix function it builds is the idea that every other string algorithm here reuses in some form. The failure function answers a single question: when a match breaks at position $i$, how much of the pattern is still matched?

## Recognition signals

- **"find the first occurrence"**, **"does the text contain"**, **"count the occurrences"**, **"find all positions where"**.
- **"a substring"**, **"a contiguous block of characters"**, **"the pattern"**. The word "substring" distinguishes the problem from the subsequence problem, which is a different and harder question.
- **"$n$ and $m$ both at $10^5$ or $10^6$"**, where a naive search would be $O(nm)$ and therefore too slow. This is the constraint that forces the subject.
- **"periodicity"**, **"the string repeats"**, **"the borders of the string"**, **"the longest proper prefix that is also a suffix"**.
- **"match the characters of"**, **"these two strings describe the same thing"**, where the comparison ignores order. That is a multiset comparison, and it is a counting problem rather than a matching problem.

The signal that rules the subject out is a question about a subsequence rather than a substring. "Is this sequence a subsequence of that one" is solved by dynamic programming in $O(nm)$ and is not a pattern-matching problem.

## Choosing a technique

| The situation | What to use |
| --- | --- |
| One pattern, one text, find the first occurrence | [KMP](/algorithms/strings/kmp) |
| One pattern, many texts | [KMP](/algorithms/strings/kmp), with the pattern's prefix function computed once |
| Many patterns, one text | Aho-Corasick, which is not covered yet |
| Two texts, decide whether they are permutations of each other | Count the characters and compare the counts |
| A text and a pattern of length one | A single scan, no technique needed |
| The pattern is short and the text is short | The naive search is fine, and it is the reference implementation |

The last row matters more than it looks. The [KMP article](/algorithms/strings/kmp) uses the naive search as the reference implementation, exactly as the [binary search article](/algorithms/searching/binary-search) uses the linear scan, because a disagreement between the two is the fastest way to find the bug.

## What this subject implies but does not yet cover

- **Rolling hashes.** A hash of every prefix of the text, so that two substrings can be compared in $O(1)$ time. It is the fastest common solution and it carries a real risk of collision, which makes the choice between a single hash and a double hash a genuine decision rather than a preference.
- **The Z algorithm.** An array that gives the length of the longest match between each suffix and the whole string, computed in linear time. It answers the same questions as the prefix function from the other direction.
- **Suffix arrays and suffix trees.** The sorted list of all suffixes of a string, which answers the longest common substring, the longest repeated substring, and many counting questions in $O(n \log n)$ or better.
- **Tries.** A tree of characters that shares the common prefixes of a set of words, and the structure behind every dictionary problem.
- **Aho-Corasick.** The automaton that matches many patterns at once, which is the trie with failure links and the standard answer to a multi-pattern search.
- **Palindromes.** The Manacher algorithm, which computes the radius of every palindromic substring in $O(n)$, and the simpler $O(n \log n)$ version built on a suffix array.
- **String hashing of subsequences**, and the difference between the string problem and the array problem, since a string comparison is not a constant-time operation in most languages.

## Related subjects

- [Searching](/algorithms/searching/) contains the general idea behind the binary search on the answer, which the string algorithms often use.
- [Range query structures](/algorithms/range-queries/) appear in the suffix array construction, which sorts a list of strings by repeated prefix comparison.
- [Dynamic programming](/algorithms/dynamic-programming/) solves the subsequence problems that this subject deliberately leaves aside.
- [Foundations](/algorithms/foundations/) supplies the binary representation, since string algorithms are often implemented over an array of integers rather than over characters.
