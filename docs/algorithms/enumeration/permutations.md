---
id: enumeration.permutations
title: Permutations
summary: Enumerate the arrangements of a set, in lexicographic order, either by backtracking or by computing the immediate successor of the current arrangement.
division: [silver, gold]
subjects: [enumeration]
level: intermediate
importance: common-contest-technique
keywords:
    [permutations, next permutation, lexicographic order, backtracking, factorial number system]
prerequisites:
    required: [enumeration.backtracking, foundations.recursion]
    recommended: [enumeration.subset-enumeration, foundations.sorting]
complexity:
    time: "O(n * n!)"
    space: "O(n)"
assumptions:
    - The number of arrangements is small enough to enumerate, or the question asks for one arrangement rather than all of them.
    - The elements are distinct, unless the duplicates are handled explicitly.
reviewed: false
---

## At a glance

| Property | Value |
| --- | --- |
| **Problem** | Enumerate the arrangements of $n$ distinct elements, or find one arrangement with a given rank |
| **Time** | $O(n \cdot n!)$ for all of them, $O(n)$ for the successor of one |
| **Auxiliary space** | $O(n)$ |
| **Requires** | A total order on the elements, so that "the next one" is well defined |
| **Fails when** | $n$ is large enough that $n!$ cannot be enumerated |
| **Primary technique** | A backtracking tree whose children are tried in increasing order, which produces the lexicographic order for free |
| **Sibling article** | The general search over partial solutions is in [backtracking](/algorithms/enumeration/backtracking) |

There are two ways to work with permutations, and they solve different problems. The backtracking enumeration produces every arrangement, one after another, in lexicographic order, and its cost is $n!$ and it cannot be beaten. The successor algorithm computes the arrangement that comes immediately after a given one in $O(n)$, without producing the ones in between.

Between them they cover most of what contests ask: enumerate the arrangements, count them, find the $k$-th one, or step from one to the next.

## Problem motivation

A vault holds $n$ distinct discs. The discs must be placed on a spindle in a row, and the order matters. Two questions are typical.

The first asks for the arrangements themselves: print every order, or count how many satisfy a condition. The second asks for a single arrangement: given $k$, print the $k$-th order in lexicographic order, or given an order, print the next one.

The constraints:

- $1 \le n \le 9$ discs, all distinct.
- The output is the arrangements in lexicographic order, or one of them.

The bound on $n$ is the whole story. There are $n!$ arrangements, and $9! = 362\,880$ is comfortable to print, while $10! = 3\,628\,800$ is already slow and $12! = 479\,001\,600$ will not fit in memory. So a problem that asks for all the arrangements must have $n \le 9$ or $n \le 10$, and a problem that asks for only the $k$-th one may have a much larger $n$, because the answer is a single object.

The question "what is the next arrangement" is the interesting one, because it looks like it needs the same enumeration but must not do it. The answer has to come from the current arrangement alone.

## Recognition patterns

Permutation techniques are the right tool when all of the following hold.

- The answer is an **arrangement** of a fixed set of elements, or a **count** of the arrangements that satisfy a condition.
- The elements are **distinct**, or their duplicates are handled explicitly.
- The output is **ordered**, and the order is the **lexicographic** one unless the statement says otherwise.
- The number of elements is **small**, at most about ten when all the arrangements are wanted.

The phrases that signal it are "arrange", "in how many ways can", "the $k$-th permutation", "the next lexicographic arrangement", "all orderings of". The phrases that rule it out are "in how many ways can the seats be filled" with $n$ in the hundreds (the answer is a product, not an enumeration), and "the number of subsets" (which is a different family of objects).

The constraint values that rule the technique in and out.

| Constraint | What it rules |
| --- | --- |
| $n \le 9$ | Every arrangement can be enumerated and printed |
| $n = 10$ | Enumeration is possible but tight; $3.6$ million arrangements |
| $n \ge 12$ | Enumeration is impossible; only the successor or the $k$-th can be computed |
| The elements are all distinct | No duplicate handling is needed |
| The elements repeat | The backtracking must skip duplicates at each level |
| The order is not specified | The output is ambiguous, so a canonical order must be chosen |

The last row is worth a sentence. When the statement says "print all arrangements" without an order, every judge accepts any order, and the lexicographic order is the one to produce because it is the one the checker usually expects.

<Synonyms terms="permutations, next permutation, lexicographic order, arrangement, factorial number system, permutation rank" />

## Naive approach

The baseline enumerates the arrangements by choosing one element at a time.

```python
def permutations(items):
    if len(items) == 0:
        yield []
        return
    for i, item in enumerate(items):
        for rest in permutations(items[:i] + items[i + 1:]):
            yield [item] + rest
```

This is $O(n \cdot n!)$ and it is correct. It is the reference implementation for the differential test.

The second baseline enumerates by swapping, which avoids the cost of copying the remaining list at every level.

```python
def permutations_by_swapping(a):
    a = list(a)
    n = len(a)
    yield list(a)
    for i in range(n - 1, 0, -1):
        for j in range(i):
            a[j], a[i] = a[i], a[j]
            yield list(a)
```

It produces the arrangements in the order of the factorial number system rather than the lexicographic order, which matters when the output order is specified.

## Key insight

The insight is that **a permutation is a bijection, and the lexicographic order on permutations has a simple successor rule**.

The lexicographic order on the arrangements of a sorted list $b_1 < b_2 < \cdots < b_n$ compares two arrangements at the first position where they differ, and the one with the smaller element there comes first. This is the same order that dictionaries use.

The successor rule follows from one observation about the suffix. Write the current arrangement as $a$. Let $i$ be the **largest** index such that $a_i < a_{i+1}$. Such an index exists unless the whole arrangement is non-increasing, which means the arrangement is the last one.

The suffix $a_{i+1}, \ldots, a_n$ is non-increasing, because $i$ is the largest index with an increase. A non-increasing suffix is the **largest** arrangement of its own elements, so no rearrangement of that suffix alone can produce a larger arrangement. Therefore any larger arrangement must change position $i$ or an earlier one, and the _smallest_ larger arrangement changes position $i$ and nothing before it.

The successor is therefore built in three moves.

1. **Find the pivot** $i$, the largest index with $a_i < a_{i+1}$.
2. **Find the successor** $j$, the largest index with $a_j > a_i$. The suffix is non-increasing, so the element just above $a_i$ in the suffix is the smallest element that is larger than $a_i$, and it sits at the largest possible index.
3. **Swap** $a_i$ and $a_j$, then **reverse** the suffix. After the swap the suffix is still non-increasing, and reversing it puts it in increasing order, which is the smallest arrangement of those elements.

Each step is $O(n)$, so the successor is $O(n)$.

The second insight is about the enumeration. A backtracking that tries the available elements in **increasing** order at every level produces the arrangements in lexicographic order, with no sorting afterwards. The reason is that the lexicographic order compares at the first differing position, and the recursion fixes the positions from left to right.

## Formal model

Let $B = \{b_1 < b_2 < \cdots < b_n\}$ be a set of distinct elements.

::: math definition Definition
A **permutation** of $B$ is a sequence $(a_1, \ldots, a_n)$ of the elements of
$B$ in which every element appears exactly once. Two permutations
$a = (a_1, \ldots, a_n)$ and $c = (c_1, \ldots, c_n)$ are in **lexicographic
order** if $a < c$ when, at the smallest index $t$ at which they differ,
$a_t < c_t$.
:::


::: math definition Definition
The **successor** of a permutation $a$ is the smallest permutation $c$ with
$a < c$ in lexicographic order. It does not exist when $a$ is
non-increasing, because that is the largest permutation.
:::


::: math lemma Lemma
Let $a$ be a permutation of $B$ that is not non-increasing, and let $i$ be the
largest index with $a_i < a_{i+1}$. Then the suffix $a_{i+1}, \ldots, a_n$ is
non-increasing, and for every $k > i$ the element $a_k$ is less than or equal
to $a_i$ or is larger than $a_i$ with the elements larger than $a_i$ appearing
before the elements smaller than $a_i$.
:::


::: math lemma Lemma
The successor of $a$ is obtained by swapping $a_i$ with the smallest element
of the suffix that is larger than $a_i$, and then arranging the suffix in
increasing order.
:::


::: math invariant Invariant
After the swap, the prefix $a_1, \ldots, a_i$ is strictly smaller than the
prefix of any permutation larger than the original one, and the suffix is the
smallest arrangement of its elements that is larger than the original suffix.
Together they make the whole permutation the smallest one larger than the
original.
:::


## Algorithm derivation

The state is the current arrangement.

1. Find the largest index $i$ with $a_i < a_{i+1}$. If there is none, the arrangement is the last one and the algorithm reports that.
2. Find the largest index $j > i$ with $a_j > a_i$.
3. Swap $a_i$ and $a_j$.
4. Reverse the suffix $a_{i+1}, \ldots, a_n$.

Step 1 finds the rightmost position that can be increased. Step 2 finds the smallest element that increases it, which is the one nearest the right end because the suffix is non-increasing. Step 3 makes the smallest possible increase. Step 4 makes the rest of the arrangement as small as possible, because after the swap the suffix is still non-increasing and its reverse is increasing.

The backtracking enumeration is the other direction. At each level, the choice is the next element of the arrangement, the candidates are the elements not yet used, and the candidates are tried in increasing order. The recursion depth is $n$ and the branching factor shrinks as the level deepens.

## Step-by-step execution

Take the arrangement $[1, 3, 2]$ and compute its successor. The permutations of $\{1, 2, 3\}$ in lexicographic order are $123, 132, 213, 231, 312, 321$, so the successor of $132$ is $213$.

- **Step 1.** Find the largest $i$ with $a_i < a_{i+1}$. Index 1 holds $3$ and index 2 holds $2$, and $3 < 2$ is false. Index 0 holds $1$ and index 1 holds $3$, and $1 < 3$ is true. So $i = 0$, and the pivot is the value 1. The suffix $[3, 2]$ is non-increasing, as it must be.
- **Step 2.** Find the largest $j > 0$ with $a_j > a_1 = 1$. The value at index 2 is 2, and $2 > 1$ is true, so $j = 2$. The value 2 is the smallest element of the suffix that is larger than 1.
- **Step 3.** Swap the pivot and the successor. The arrangement becomes $[2, 3, 1]$.
- **Step 4.** Reverse the suffix after the pivot, which is $[3, 1]$. The reversal gives $[1, 3]$, so the arrangement becomes $[2, 1, 3]$.

The result is $213$, which is the permutation immediately after $132$ in the list.

## Correctness proof

::: math theorem Theorem
The successor algorithm returns the smallest permutation larger than the given one, and reports that no successor exists exactly when the given permutation is the largest one.
:::


::: math proof Proof
Suppose the arrangement is not non-increasing, and let $i$ be the pivot. The
suffix after $i$ is non-increasing, so it is the largest arrangement of its
own elements. No permutation that agrees with $a$ on the positions before $i$
and rearranges only the suffix can be larger than $a$. Therefore every
permutation larger than $a$ differs from $a$ at some position at or before
$i$.

Let $c$ be the successor. The permutation $a$ is smaller than $c$, so at the first position $t$ where they differ, $a_t < c_t$. If $t < i$, then $c$ agrees with $a$ on the suffix, which is the largest arrangement of its elements, so $c$ is larger than the permutation that agrees with $a$ everywhere before $i$ and has the smallest increase at $i$. Such a permutation exists, so the successor does not differ before $i$. Hence $t = i$.

Now $c_i > a_i$, and $c$ must be the smallest permutation that agrees with $a$ before $i$ and has a larger element at $i$. The smallest such element is the smallest element of the suffix that is larger than $a_i$, and the algorithm chooses it. By the lemma, the suffix is non-increasing, so that element sits at the largest index $j$ with $a_j > a_i$, and it is the last element of the suffix that exceeds $a_i$. Swapping it into position $i$ puts exactly that element there.

After the swap, the suffix is still non-increasing, and its elements are the same as before. The smallest arrangement of the suffix is its reverse, since the suffix is non-increasing and reversing makes it increasing. The algorithm reverses it, so the suffix is as small as possible, and the whole permutation is the smallest one larger than $a$.

Finally, if no pivot exists then the arrangement is non-increasing, which is the largest arrangement of its elements, and there is no successor. $\square$
:::


## Complexity analysis

**Time: $O(n)$ for one successor.** The pivot is found by scanning from the right, the successor by another scan from the right, the swap is $O(1)$, and the reversal is $O(n)$.

**Time: $O(n \cdot n!)$ for all of them.** There are $n!$ arrangements, and each successor costs $O(n)$. The backtracking enumeration has the same cost, since it visits $n!$ leaves and does $O(n)$ work per leaf in the worst case, or $O(1)$ per node when the arrangement is written into a shared buffer.

**Auxiliary space: $O(n)$** for the arrangement and the used flags. The backtracking version also uses $O(n)$ frames of recursion, which is the same bound.

::: math complexity Complexity
One successor: $O(n)$ time and $O(1)$ extra space beyond the arrangement.
All of them by stepping: $O(n \cdot n!)$ time and $O(n)$ space. All of them
by backtracking: $O(n \cdot n!)$ time and $O(n)$ space.
:::


## Algorithm selection

| Situation | What to use |
| --- | --- |
| All the arrangements of a small set | Backtracking with the elements tried in increasing order |
| The $k$-th arrangement in lexicographic order | The factorial number system, in [unranking](#problem-2-the-k-th-arrangement) |
| The arrangement after a given one | The successor algorithm |
| The rank of a given arrangement | The factorial number system, in reverse |
| The arrangements of a set with repeated elements | Backtracking that skips the duplicates at each level |
| The circular arrangements of a set | Fix the first element and permute the rest |
| The number of arrangements | $n!$, computed directly, without enumerating them |

The last row is the most valuable one in contests. "In how many ways" is a request for a formula, not for an enumeration, and the answer is $n!$ divided by the factorials of the repeated multiplicities.

## Recursion decision

The backtracking version recurses once per element, so the depth is $n$. The successor version has no recursion at all, and the two facts together decide the question.

| Language | Default stack | Practical depth | Recommendation |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | About $10^5$ frames | A recursion of depth 9 is nothing; use the loop for larger $n$ |
| Java | 512 KB to 1 MB per thread | About $10^4$ frames | The same |
| Python | Interpreter limit of 1000 | 1000 frames | The same; a depth of 9 is well inside the limit |
| Pascal | The operating system stack | Depends on the platform | The same |
| JavaScript | The V8 engine limit | About $10^4$ frames | The same |

The recursion depth is never the problem when $n \le 9$, because the enumeration itself stops long before the stack does. The successor version is worth preferring anyway for a different reason: it has no stack, it uses $O(1)$ extra space, and it can be used for a set far larger than ten elements when only a few arrangements are needed.

## Implementation walkthrough

The three lines that carry the technique are the pivot scan and the two moves that follow.

```cpp
int i = n - 2;
while (i >= 0 && a[i] >= a[i + 1]) --i;    // the rightmost place that can be increased
if (i < 0) return false;                     // the arrangement is the last one

int j = n - 1;
while (a[j] <= a[i]) --j;                    // the smallest element that increases it
std::swap(a[i], a[j]);
std::reverse(a.begin() + i + 1, a.end());    // the smallest order of the suffix
```

The scans run **from the right**. Scanning from the left would find the first increase instead of the last one, and the first increase is not the right pivot: the suffix after the first increase is generally not non-increasing, and the reversal would then be wrong.

The comparison in the successor scan is `a[j] <= a[i]`, so it stops at the first element from the right that is strictly larger than the pivot. Since the suffix is non-increasing, that element is the smallest one above the pivot.

## Common mistakes

| Mistake | What happens | How to avoid |
| --- | --- | --- |
| Finding the pivot from the left | The suffix is not non-increasing and the reversal is wrong | Scan from the right |
| Swapping with the first element above the pivot | The successor is too large | Use the smallest element above the pivot, which is the rightmost one |
| Sorting the suffix instead of reversing it | The same answer, at $O(n \log n)$ instead of $O(n)$ | Reverse it |
| Forgetting the non-increasing case | The last arrangement produces an invalid index | Return a flag when there is no pivot |
| Trying the elements in the input order in backtracking | The output is not in lexicographic order | Sort the elements, or try them in increasing order |
| Ignoring repeated elements | The same arrangement is produced many times | Skip duplicates at each level of the recursion |
| Confusing the $k$-th arrangement with the arrangement at index $k-1$ | An off-by-one on every answer | Decide whether the numbering starts at zero |

### Why this fails: the successor that is one step too large

The mistake that survives review is choosing the wrong element to swap with the pivot. The rule "swap the pivot with an element that is larger" is correct, and the rule "swap with the _smallest_ larger element" is correct, and the code that implements the second rule sometimes picks the first larger element it meets while scanning from the left.

The smallest counterexample is the arrangement $[1, 3, 2]$.

The correct successor is $[2, 1, 3]$, since the permutations of $\{1, 2, 3\}$ in lexicographic order are $123, 132, 213, 231, 312, 321$.

The wrong version scans the suffix from the left for the first element larger than the pivot. The pivot is the value 1 at index 0, and the suffix is $[3, 2]$. The first element larger than 1 is the 3 at index 1, so the algorithm swaps it with the pivot and obtains $[3, 1, 2]$. The suffix $[1, 2]$ is already increasing, so the reversal leaves it alone, and the algorithm reports $[3, 1, 2]$.

The reported arrangement is a permutation, and it is larger than the original, so the code looks like it worked. It is not the successor: $213$ lies between $132$ and $312$, and the algorithm skipped over it.

Two elements are not enough to break it, because with two elements the suffix holds a single element and the first larger element is also the smallest one. Three is the smallest array that exposes the flaw.

The second failure, of a different kind, is repeated elements. Take the multiset $\{a, a, b\}$ and enumerate the arrangements by choosing the unused elements in increasing order without any duplicate check. The recursion reaches $aab$, $aba$, $aab$, $aba$, $baa$, $baa$: six arrangements, three of them repeated twice, because the two copies of $a$ are distinct choices that happen to produce the same sequence. The fix is to skip a candidate that equals the candidate just tried at the same level of the recursion.

The lesson generalizes: **the successor is defined by the smallest possible increase, and the enumeration is defined by the order in which the choices are tried.** Both are about picking the smallest change, not merely a change.

## Variants and extensions

- **Permutations of a multiset.** Skip a candidate at a level of the recursion when it equals the previous candidate, after sorting. The count is $n!$ divided by the factorials of the multiplicities.
- **Partial permutations.** The arrangements of length $k$ of an $n$-element set, which is a tree with $n(n-1)\cdots(n-k+1)$ leaves.
- **Circular permutations.** Fix one element in the first position and permute the rest, which divides the count by $n$.
- **The rank of an arrangement.** The factorial number system in reverse, using the Lehmer code of each position.
- **The $k$-th arrangement.** The factorial number system, which is $O(n)$ given the factorials.
- **The next arrangement in a different order.** The Heap's algorithm produces the arrangements in a different order with no copies at all, and the Steinhaus-Johnson-Trotter algorithm produces them by adjacent transpositions.
- **Permutations with restrictions.** A backtracking that only accepts arrangements satisfying a condition, with the check made at the earliest level at which it can be decided.

## Contest strategy

Under time pressure the errors above are what cost points, and each of them is avoidable with a fixed procedure.

1. Decide which of the three questions is being asked: all of them, the $k$-th one, or the next one. They have different costs and different techniques.
2. If all of them are wanted, sort the elements first and try them in increasing order, so that the output is in lexicographic order for free.
3. If the elements repeat, decide whether the statement counts distinct arrangements or indexed ones, and say which in the write-up.
4. For the successor, remember that both scans run from the right.
5. Check the last arrangement, which is the non-increasing one, and make sure the code reports it rather than reading out of bounds.
6. Remember that $n!$ is the number of arrangements, and that $9! = 362\,880$ is comfortable while $12!$ is not.

## Worked problems

### Problem 1: the next arrangement

**Restatement.** Given an arrangement of $n$ distinct elements, print the next arrangement in lexicographic order, or print that there is none. Constraints: $1 \le n \le 100\,000$.

**Naive baseline.** Generate every arrangement up to the given one and keep the last, at $O(n \cdot n!)$.

**Insight.** The rightmost position that can be increased is the pivot, and the suffix after it is already the largest arrangement of its elements.

**Derivation.** Run the successor algorithm of the algorithm derivation.

**Correctness.** The theorem shows the result is the immediate successor, and that the non-increasing case is the last arrangement.

**Complexity.** $O(n)$ time and $O(1)$ space beyond the array.

**Common wrong approach.** Swapping with the first larger element found from the left, which skips arrangements.

### Problem 2: the $k$-th arrangement

**Restatement.** Given $n$ distinct elements in increasing order and an integer $k$, print the $k$-th arrangement in lexicographic order, with $k$ starting at 1. Constraints: $1 \le n \le 20$, $1 \le k \le n!$.

**Naive baseline.** Generate the arrangements until the $k$-th one, at $O(n \cdot k)$ time.

**Insight.** The arrangements are grouped into blocks of $(n-1)!$ by the first element, into blocks of $(n-2)!$ by the second, and so on.

**Derivation.** Work through the positions from the left. At position $i$ there are $n - i$ elements left, and each choice of the first of them covers $(n-i-1)!$ arrangements. Divide $k-1$ by that block size to find which element to take, and keep the remainder. Take that element from the remaining sorted list and remove it.

**Correctness.** The arrangements are grouped into consecutive blocks of equal size by the first element, so dividing the rank by the block size selects the correct block, and the remainder is the rank inside the block. Applying the same argument to the remaining positions finishes the construction.

**Complexity.** $O(n^2)$ time, because removing an element from a list is $O(n)$, and $O(n)$ space.

**Common wrong approach.** Using the block size $(n-i)!$ instead of $(n-i-1)!$, which shifts the answer by one block.

### Problem 3: the distinct arrangements of a repeated set

**Restatement.** Given a string of $n$ characters, some of which repeat, print all the distinct arrangements. Constraints: $1 \le n \le 9$.

**Naive baseline.** Permuting the positions and removing duplicates afterwards, at $O(n \cdot n!)$ with a set of the results.

**Insight.** Two copies of the same character are interchangeable, so at each level of the recursion only one of them should be tried.

**Derivation.** Sort the characters, and at each level of the recursion try the unused characters in increasing order, skipping a character that equals the character just tried at that level.

**Correctness.** The two copies of a character produce the same sequence, so choosing between them is not a real choice. Skipping the second copy removes exactly the duplicate branches and leaves every distinct arrangement once.

**Complexity.** $O(n \cdot n! / \prod m_i!)$ time, where $m_i$ are the multiplicities, and $O(n)$ space.

**Common wrong approach.** Skipping the duplicate at the wrong level, which removes the arrangements where the characters are genuinely in different positions.

## Practice progression

1. **Recognition.** Given a statement, decide whether permutations are involved and which of the three questions it asks. Look for "arrange", "in how many ways", and the size of $n$.
2. **Direct application.** Implement the backtracking enumeration in lexicographic order, and the successor algorithm, and verify both against each other.
3. **Adaptation.** Implement the enumeration for a multiset, the $k$-th arrangement by unranking, and the rank of an arrangement.
4. **Combination.** Combine the enumeration with a validity check, so that only the arrangements satisfying a condition are produced, and with a counting variant that counts instead of printing.
5. **Challenge.** Solve a problem with $n = 12$ where only the $k$-th arrangement is asked, and show that the unranking is $O(n)$ while the enumeration is $O(n \cdot n!)$.
6. **Transfer.** Recognize the same shape in a different setting: the arrangements of a circuit's components, the seating orders of a round table, and the orderings of a dependency list that a scheduler produces.

## Review checklist

Answer these without looking back. If you cannot, revisit the section named in parentheses.

1. What makes the suffix after the pivot a non-increasing sequence? (Key insight)
2. State the three steps of the successor algorithm. (Algorithm derivation)
3. Why must the pivot be found from the right? (Common mistakes)
4. Why is the successor built by the smallest possible increase? (Correctness proof)
5. What does the backtracking produce in lexicographic order without any extra work? (Key insight)
6. Give the smallest arrangement that breaks the wrong successor rule. (Common mistakes)
7. How is the count of arrangements of a multiset obtained? (Algorithm selection)
8. How does the factorial number system select the $k$-th arrangement? (Worked problems)
9. Why does the enumeration of a multiset need a duplicate check at each level? (Common mistakes)
10. What is the running time of one successor, and of all of them? (Complexity analysis)
11. When does a permutation problem stop being an enumeration problem? (Recognition patterns)
12. Which languages would break on a recursive enumeration, and how deep would it go? (Recursion decision)

## Further reading

- The search over partial solutions that the enumeration is built from is in [backtracking](/algorithms/enumeration/backtracking).
- The other family of arrangements, the subsets, is in [subset enumeration](/algorithms/enumeration/subset-enumeration).
- The counting that replaces the enumeration when only a number is wanted is in [binomial coefficients](/algorithms/combinatorics/binomial-coefficients).
- The sort that puts the elements in the order the successor algorithm needs is in [sorting](/algorithms/foundations/sorting).
- The search over a tree with a bound on each subtree is in [branch and bound](/algorithms/enumeration/branch-and-bound).
