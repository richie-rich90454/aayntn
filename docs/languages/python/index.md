---
id: languages.python
title: The Python center
summary: The language the USACO judge actually runs, its input strategies and their memory trade-off, its integer arithmetic, the cost of its containers, and the recursion ceiling that raising a counter does not remove.
division: []
subjects: [foundations]
level: intermediate
importance: core-prerequisite
keywords: [Python, heapq, bisect, deque, sys.stdin.buffer, recursion limit, arbitrary precision]
prerequisites:
    required: []
    recommended:
        [
            start.computational-foundations,
            start.data-structures,
            start.language-transition,
            foundations.complexity,
            foundations.recursion,
        ]
reviewed: false
draft: false
---

<Synonyms terms="Python, CPython, Python 3, scripting language, dynamic typing" />

Python is the shortest distance between an idea and a working program, and it is one of the four languages USACO accepts for submission. It is also the language in this encyclopedia with the most surprising performance properties, most of which come from a single design decision: everything is an object, and every object is allocated on the heap.

This center describes Python as the judge runs it, not as it runs on a laptop with a newer interpreter.

## The version you are targeting

**The published USACO contest instructions were last checked on 21 October 2026.** They state that USACO offers **Python 2.7.17** and **Python 3.6.9**, that the submission must select the correct version, and that executions are run with the `-O` flag to enable some optimization. They also state that the slower speed of Python means it is not always possible to solve the largest test cases of every problem, even with the inflated time limit given to Python submissions.

Every example in this center that is presented as targeting the judge is written for **Python 3.6** and uses no syntax newer than 3.6. The table below lists the features that people reach for, and which of them a 3.6 interpreter has.

| Feature                                        | First version | Available in 3.6 |
| ---------------------------------------------- | ------------- | ---------------- |
| f-strings, `f"{value}"`                        | 3.6           | yes              |
| Underscores in numeric literals, `1_000_000`   | 3.6           | yes              |
| Insertion of a starred iterable into a literal | 3.5           | yes              |
| The walrus operator, `:=`                      | 3.8           | no               |
| `math.isqrt`, `math.prod`                      | 3.8           | no               |
| Positional-only parameters, `def f(a, /)`      | 3.8           | no               |
| `dict` union, `a                               | b`            | 3.9              | no  |
| Built-in generics, `list[int]`                 | 3.9           | no               |
| `str.removeprefix`, `str.removesuffix`         | 3.9           | no               |
| `math.lcm`                                     | 3.9           | no               |
| `int.bit_count`                                | 3.10          | no               |
| `itertools.pairwise`                           | 3.10          | no               |
| `match` statements                             | 3.10          | no               |
| `dataclasses`                                  | 3.7           | no               |
| `from __future__ import annotations`           | 3.7           | no               |

The one that catches people is the dict. In Python 3.6 a dict preserves insertion order as an implementation detail of the interpreter, and the language guarantees it from 3.7 onwards. Relying on the order of a dict in a 3.6 submission works on the judge, but it is relying on an implementation detail rather than on the language, so the safe habit is to sort explicitly when the order matters.

## The advantages and the risks

The advantages are real and they are what makes Python the best first language for this material.

You write the algorithm and not the scaffolding. There is no type declaration, no header, and no destructor to get right, and the code for an algorithm is close to the code on the whiteboard. The standard library has a container for almost everything, and the container is one line away. The feedback loop is short, and a mistake produces a traceback that names the line, the expression, and the value that was wrong.

The risks are equally real, and they are the four you will meet in a contest.

**The constant factor is large.** A Python operation costs one to two orders of magnitude more than the equivalent compiled operation. A perfectly correct $O(n \log n)$ solution in Python can time out on a problem that a C++ solution of the same complexity passes comfortably.

**Memory costs more.** A Python `int` is a heap object with a header, so a list of a million integers costs tens of megabytes rather than the four megabytes of a C array of `int`. The published memory limit is about 256 MB, and a Python program reaches it much sooner than a compiled one.

**The recursion ceiling is low.** Python's default limit is 1000 frames, and a graph traversal in a contest is routinely deeper than that.

**The version is fixed.** The judge runs 3.6.9, and the syntax of a newer Python may not exist there.

## Two input strategies

### The line-by-line template

Read one line at a time, parse it, and keep going. This is the strategy that matches how a contest input is usually shaped, and it is the one that uses the least memory.

```python
import sys


def main():
    read = sys.stdin.buffer.readline

    n = int(read())
    values = [int(read()) for _ in range(n)]

    total = sum(values)

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    main()
```

`sys.stdin.buffer.readline` reads raw bytes rather than text, and `int` accepts a `bytes` object, so there is no decoding step. The cost is one call per line, which is fine when the number of lines is bounded by the size of the input.

The weakness is the assumption: one value per line. When a line holds several values, split it. When a value wraps across a line break, the program must be rewritten, and the failure appears in the middle of the computation.

### The bulk-token alternative

Read the whole input, split it into tokens, and convert them all at once.

```python
import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    values = data[1:1 + n]

    total = sum(values)

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    main()
```

The line `data = list(map(int, sys.stdin.buffer.read().split()))` is the one you will see in most Python solutions, and it is the fastest of the simple strategies: it reads the input in one system call, splits it in one pass in C, and converts it in one pass in C.

### The memory trade-off, spelled out

The bulk version is faster and it costs more memory, and the cost is larger than it looks. At the moment the list comprehension finishes, the program holds three things at once.

It holds the raw bytes of the input, which is the size of the input file. It holds the list of token objects that `split` produced, which is one Python string object per token, and a string object has a header of its own on top of its characters. And it holds the list of integer objects that `map` produced, which is one Python integer object per token, and an integer object has a header of its own on top of its value.

So the peak memory of the bulk version is the input size, plus a per-token string overhead, plus a per-token integer overhead, plus two lists of pointers. The line-by-line version holds one line at a time plus the data you decided to keep, and it never materialises the tokens for the lines you have already consumed.

The practical rule: use the bulk version when the input is at most a few hundred thousand tokens, and use the line-by-line version when the input is large and the data you keep is small. A program that reads a million tokens, keeps one number per token, and does nothing else is the case where the bulk version hurts most, because it holds the whole token list alive at the moment it builds the integer list.

There is a third option that avoids both extremes. Read the whole input as bytes, and walk it with an index, converting only the numbers you need. It is more code, and it is the right answer when the input is enormous and only a fraction of it matters.

One more detail, straight from the published instructions: the input and output files must end with a newline, and a program that splits the input on `"\n"` and assumes every line is complete is the single most common reason a solution that "works on my machine" fails on the judge.

## Python integer arithmetic

A Python `int` has **arbitrary precision**. The value `2 ** 1000` is computed exactly, and `10 ** 30` is a single object. There is no overflow, and there is no need for a `long long` or a `BigInteger` type.

The cost is not free. A small integer, from -5 to 256, is a cached object, so `x is y` is true for two small integers with the same value. Outside that range, every integer that a program computes is a fresh heap allocation, and the allocation is the dominant cost of the arithmetic itself.

The cost of the arithmetic grows with the size of the numbers. Adding two $k$-digit integers costs $O(k)$. Multiplying them costs more than a constant, and the cost grows faster than linearly with the number of digits, because CPython switches to a divide-and-conquer multiplication for large operands. A program that multiplies a million-digit number in a loop does not finish, and the reason is the arithmetic, not the loop.

The two traps are these.

**Integer division is not truncation.** In Python, `7 // 2` is `3` and `-7 // 2` is `-4`, because the floor division rounds toward negative infinity. In C and C++, integer division truncates toward zero, so `-7 / 2` is `-3` there. The same expression means different things in the two languages, and a program that was ported without checking will produce a different answer.

**Floating point is not exact.** `0.1 + 0.2` is not `0.3` in Python, and it is not in any other language either, because a double holds 53 bits of mantissa and `0.1` has no exact binary representation. Use integers for every exact computation, and use `//` for a division that must be exact.

```python
import sys


def main():
    # Integer arithmetic is exact at any size.
    big = 10 ** 30
    sys.stdout.write(str(big * big) + "\n")

    # Floor division rounds toward negative infinity.
    sys.stdout.write(str(-7 // 2) + "\n")

    # Exact division of integers needs no floating point.
    numerator = 7
    denominator = 2
    sys.stdout.write(str(numerator // denominator) + "\n")


if __name__ == "__main__":
    main()
```

## The cost of the containers

| Operation | Cost | The condition under which it holds |
| --- | --- | --- |
| `list.append(x)` | $O(1)$ amortised | CPython over-allocates the list, so the copies are geometric |
| `list.insert(i, x)`, `list.pop(0)` | $O(n)$ | Every element from index $i$ onwards is moved |
| `x in list` | $O(n)$ | The list is scanned from the front |
| `list.sort()` | $O(n \log n)$ | Timsort, which is $O(n)$ on an already sorted list |
| `dict[key]` lookup | $O(1)$ average | Hashing a key is $O(1)$ and the table is not degenerate |
| `key in dict` | $O(1)$ average | The same |
| `dict.get(key, default)` | $O(1)$ average | The same, and it does not insert a missing key |
| `set` add and lookup | $O(1)$ average | The same |
| `sorted(iterable)` | $O(n \log n)$ | A new list is built, so the time and the space are both spent |

The two facts that matter most in practice are these. **Inserting into the middle of a list is linear**, so a list is the wrong structure for a queue and the right one for a stack. And **`dict[key]` inserts a missing key with a default value**, so a membership test written as `if key not in d: d[key] = ...` and a lookup written as `d[key]` have different effects on the size of the dict.

`collections.Counter` and `collections.defaultdict` are the two tools that replace most hand-written counting code.

```python
import sys
from collections import Counter, defaultdict


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return

    n = data[0]
    values = data[1:1 + n]

    counts = Counter(values)
    sys.stdout.write(str(counts[values[0]]) + "\n")

    grouped = defaultdict(list)
    for value in values:
        grouped[value % 3].append(value)
    sys.stdout.write(str(len(grouped)) + "\n")


if __name__ == "__main__":
    main()
```

## `heapq`, `deque`, `bisect` and `itertools`

These four modules cover most of what a contest needs beyond the built-in containers.

`heapq` is a **min-heap**. `heapq.heapify` builds a heap from a list in $O(n)$, and `heapq.heappush` and `heapq.heappop` each cost $O(\log n)$. There is no way to change the priority of an element already inside the heap, so the standard technique is to push a second entry and to discard the stale one when it surfaces. `heapq.nlargest` and `heapq.heapify` are the shortcuts.

`collections.deque` is a **double-ended queue**. `append`, `appendleft`, `pop` and `popleft` are all $O(1)$, and `deque` is the structure to use for a breadth-first search, where a `list` with `pop(0)` would be linear per removal.

`bisect` is a **binary search** over a sorted sequence. `bisect.bisect_left` returns the first position at which the value could be inserted, and `bisect.bisect_right` returns the first position at which a strictly greater value could be inserted. Both cost $O(\log n)$, with a binary search per comparison.

`itertools` is a set of **lazy iterators**. `itertools.groupby` groups consecutive equal elements, `itertools.accumulate` produces running totals, `itertools.chain` concatenates iterables, and `itertools.combinations` and `itertools.permutations` enumerate subsets and orderings without materialising them.

```python
import sys
from bisect import bisect_left, bisect_right
from collections import deque
from heapq import heapify, heappop, heappush
from itertools import accumulate, groupby


def main():
    values = [5, 1, 3, 3, 9]

    heap = list(values)
    heapify(heap)
    heappush(heap, 0)
    sys.stdout.write(str(heappop(heap)) + "\n")

    ordered = sorted(values)
    sys.stdout.write(str(bisect_left(ordered, 3)) + " " +
                     str(bisect_right(ordered, 3)) + "\n")

    queue = deque(values)
    queue.appendleft(0)
    sys.stdout.write(str(queue.popleft()) + "\n")

    sys.stdout.write(" ".join(str(total) for total in accumulate(values)) + "\n")

    for key, group in groupby(sorted(values)):
        sys.stdout.write(str(key) + " " + str(len(list(group))) + "\n")


if __name__ == "__main__":
    main()
```

## Memory allocation overhead

A Python object carries a header, and the header is why a Python program uses so much more memory than the same algorithm in C.

A `list` stores pointers, eight bytes each on a 64-bit build, and it stores them in one contiguous block. An `int` is a separate heap object with a header and a value, and a `str` is a separate heap object with a header and a length and the characters. So a list of a million distinct integers holds an eight-megabyte array of pointers plus a million twenty-eight-byte objects, and the objects are allocated one at a time.

Three consequences follow, and each of them is a real contest decision.

**Use `array` when the numbers are large and uniform.** The `array` module stores numbers in a contiguous block of machine words, with no object per element, so an `array` of a million integers is a few megabytes rather than tens.

**Use `bytes` or `bytearray` for text data.** A `bytes` object is one block, and indexing it gives an integer in Python 3, not a character.

**Avoid a list of lists when the inner lists are small.** A list of a million empty lists is a million list objects, and each one costs more than the list of pointers that holds them.

## Deep recursion, and why raising the limit is not the answer

Python counts the frames of the interpreter's own call stack, and the counter starts at 1000. `sys.getrecursionlimit()` reports it and `sys.setrecursionlimit(n)` changes it.

**Raising the limit does not make deep recursion safe.** The counter is a software guard inside the interpreter, and the interpreter itself runs on the machine's real call stack, one machine frame per Python frame. Raise the limit to a million and the interpreter does not get a bigger stack; it walks off the end of the real one, and the process dies with a segmentation fault instead of a Python exception. A segmentation fault loses the whole run, while a `RecursionError` at least leaves a traceback.

This is why the practice of writing `sys.setrecursionlimit(10 ** 6)` at the top of a Python solution is a trap. It converts a clean error into a crash, and it does not make the program correct on the deep case.

The size of the real stack also depends on the machine and on the interpreter build, so a depth that works on a laptop can fail on a judge with a smaller stack. The bound that holds everywhere is the counter's default of 1000.

### The iterative alternative

Replace the call stack with an explicit stack. The traversal is then bounded by the heap rather than by the interpreter's stack, and it works on any input.

```python
import sys


def dfs_iterative(adj, source):
    """Return the vertices reachable from source, in visit order.

    The stack replaces the call stack, so a chain of any length is
    traversed without recursion.
    """
    if source < 0 or source >= len(adj):
        return []

    visited = [False] * len(adj)
    stack = [source]
    order = []
    while stack:
        v = stack.pop()
        if visited[v]:
            # The vertex was already reached through another edge.
            continue
        visited[v] = True
        order.append(v)
        for w in adj[v]:
            if not visited[w]:
                stack.append(w)
    return order


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return

    n = data[0]
    m = data[1]
    adj = [[] for _ in range(n)]
    index = 2
    for _ in range(m):
        if index + 1 >= len(data):
            break
        u = data[index]
        v = data[index + 1]
        index += 2
        if 0 <= u < n and 0 <= v < n:
            adj[u].append(v)
            adj[v].append(u)
    source = data[index] if index < len(data) else -1

    order = dfs_iterative(adj, source)
    sys.stdout.write(str(len(order)) + "\n")


if __name__ == "__main__":
    main()
```

The same argument applies to the breadth-first search, where the frontier is a `collections.deque` and the call stack never grows at all.

### Recursion-heavy dynamic programming

A memoised recursive dynamic program has the same problem, and often a worse one: the depth of the recursion is the length of the longest dependency chain, which for a knapsack or a longest-increasing-subsequence table is proportional to the size of the input.

The fix is not a bigger recursion limit. It is to compute the table in dependency order, from the bottom up, so that the answer is available before it is needed. A recursive `solve(i)` that depends on `solve(i - 1)` becomes a loop over `i` in increasing order. A recursive `solve(i, j)` that depends on `solve(i - 1, j)` and `solve(i, j - 1)` becomes a loop over the table in row-major order, with each cell written once.

The two forms compute the same table and the same answer, and the bottom-up form has no recursion limit to worry about, allocates one table instead of a dictionary of memoised results, and is often faster because the dictionary lookup in the recursive form is the expensive part.

## The recursion recommendation for Python

**Use an explicit stack, not the interpreter's call stack.** The default limit of 1000 is far below the depth of any graph traversal in a contest, and a chain-shaped graph gives recursion depth proportional to the number of vertices, so an $O(V + E)$ recursive depth-first search is not automatically safe at any limit.

The exceptions are small and worth naming. A divide-and-conquer algorithm whose depth is $O(\log n)$ is fine, because a million-element input gives a depth of twenty. A backtracking search whose depth is bounded by a small constant is fine. A recursion over a tree whose depth is bounded by a small constant is fine.

Everything else should be an explicit stack or a bottom-up table.

## Debugging advice

Python's traceback is the best debugging tool in this encyclopedia, and the habit that makes it useful is to read it from the bottom up. The last line names the exception and the message, and the line above it names the statement that raised it. The frames above that are the call chain, and the frame you want is usually the first one that is yours.

Three Python-specific failure modes account for most wrong answers.

The first is a `KeyError` on a `dict`, which almost always means the input was parsed differently from how the algorithm assumed. Print the parsed data once and compare it with the problem statement before looking at the algorithm.

The second is a `TypeError` from mixing a `list` and a `tuple`, or from slicing with a `None`. They are the same error at the same place, and the message names it.

The third is a wrong answer with no exception at all, and it is nearly always an off-by-one in a range. A `range(n)` covers `0` through `n - 1`, a `range(1, n + 1)` covers `1` through `n`, and a slice `a[0:n]` is exclusive of `n` while `a[0:n + 1]` is inclusive of it.

Two habits make Python faster without any cleverness. Bind the hot functions to a local name, because a global lookup is a dictionary lookup and a local lookup is not. And build the output with a list comprehension and a single `join`, because `"".join` writes the string once while repeated `+=` on a string copies it every time.

## Template library

**The line-by-line general program.**

```python
import sys


def main():
    read = sys.stdin.buffer.readline

    n = int(read())
    values = [int(read()) for _ in range(n)]

    total = sum(values)

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    main()
```

**The bulk-token general program.**

```python
import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    values = data[1:1 + n]

    total = sum(values)

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    main()
```

**Graph input with the bulk reader.**

```python
import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return

    n = data[0]
    m = data[1]
    if n <= 0:
        sys.stdout.write("0\n")
        return

    adj = [[] for _ in range(n)]
    index = 2
    for _ in range(m):
        if index + 1 >= len(data):
            break
        u = data[index]
        v = data[index + 1]
        index += 2
        if 0 <= u < n and 0 <= v < n:
            adj[u].append(v)
            adj[v].append(u)
    source = data[index] if index < len(data) else -1

    # Solve the problem here, using adj and source.


if __name__ == "__main__":
    main()
```

**Weighted graph input with a min-heap of distances.**

```python
import heapq
import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 4:
        return

    n = data[0]
    m = data[1]
    adj = [[] for _ in range(n)]
    index = 2
    for _ in range(m):
        if index + 2 >= len(data):
            break
        u = data[index]
        v = data[index + 1]
        w = data[index + 2]
        index += 3
        if 0 <= u < n and 0 <= v < n:
            adj[u].append((v, w))
            adj[v].append((u, w))
    source = data[index]

    infinity = float("inf")
    distance = [infinity] * n
    distance[source] = 0
    heap = [(0, source)]
    while heap:
        current, u = heapq.heappop(heap)
        if current != distance[u]:
            # A shorter path was found after this entry was pushed.
            continue
        for v, w in adj[u]:
            candidate = current + w
            if candidate < distance[v]:
                distance[v] = candidate
                heapq.heappush(heap, (candidate, v))

    sys.stdout.write(" ".join(str(d) for d in distance) + "\n")


if __name__ == "__main__":
    main()
```

## What to remember

Python is the best language in this encyclopedia for learning the algorithms, and it is a submission language for the problems whose constants it can afford.

The four habits that pay for themselves are these. Use the bulk reader when the input is small enough and the line reader when it is not, and know which one you are using and why. Use `int` for every exact computation, and `//` for a division that must round a particular way. Bound the depth of your recursion separately from the time it takes, and never by raising the recursion limit. And write the code for 3.6, because that is what the judge runs.
