---
id: templates.overview
title: The template library
summary: What a template is, the six starting programs, the categories of reusable code, and the bugs each one carries with it.
division: []
subjects: []
level: introductory
importance: core-prerequisite
keywords: [templates, boilerplate, fast input, starting program, io]
prerequisites:
    required: []
    recommended: [start.language-transition]
reviewed: false
---

A template is a reusable preparation pattern: a piece of code you write once, in advance, so that the mechanical part of a solution costs you nothing when the clock is running. Reading the input, turning off stream synchronization, declaring the array, printing the answer, and freeing the memory are all mechanical. None of them should take any of your attention during a contest.

**Memorizing a header file is not the same as understanding the algorithms inside it.** A template solves the plumbing and nothing else. It does not tell you which algorithm to use, it does not prove that the algorithm is correct, and it does not survive a change of the input format unless you know how it reads. A competitor who has a complete template library and no understanding of a single algorithm scores zero; a competitor who has no template and a complete understanding of the algorithms can write the plumbing in four minutes. The templates are worth having because they remove a cost, not because they supply a capability.

There is a second reason to write them in advance, and it is the one the contest rules make relevant. During an active contest you may consult references covering the basic functionality of your programming language, but you may not use prewritten code or templates. A template you have rewritten yourself, from memory, until you could reproduce it from nothing is preparation. A template you copied is a resource you are not permitted to use. The exercise at the end of this page exists to move you from the first category to the second.

## The categories of template

| Category | What the template provides | Where it is discussed |
| --- | --- | --- |
| Starting programs | The complete skeleton of a solution in each language, from the includes to the return | The six [language centers](/languages/) |
| Fast input and output | Buffered readers, stream flags, bulk reads, and the one-write output habit | [Language transition](/start/from-ap-csa/part-5-language-transition) |
| Containers | The declaration of each standard container in each language, with its cost | [Language comparison](/languages/) |
| Number theory | Sieve, extended Euclidean algorithm, modular exponentiation, factorial tables | [Discrete mathematics](/start/from-ap-csa/part-3-discrete-mathematics) |
| Graph foundations | Adjacency lists, edge lists, traversal scaffolding, integer widths | [Graph representation](/algorithms/graphs/representation) |
| Graph algorithms | Priority queue, distance arrays, topological order, union-find scaffolding | [Graphs](/algorithms/graphs/) |
| Range queries | Fenwick tree, segment tree, sparse table construction | [Range query structures](/algorithms/range-queries/) |
| Dynamic programming structures | Flattened tables, row offsets, in-place update loops | [Dynamic programming](/algorithms/dynamic-programming/) |
| Geometry | The point type, the cross and dot products, the orientation test, exact integer arithmetic | [Computational geometry](/algorithms/geometry/) |
| Debugging | Assertions on invariants, timing scaffolding, a brute-force comparison harness | [Contest problem-solving literacy](/start/from-ap-csa/part-6-contest-literacy) |
| Testing | Generators for boundary inputs, a shrinker, an exact-output comparator | [Contest problem-solving literacy](/start/from-ap-csa/part-6-contest-literacy) |
| Historical input | The file-based reading and writing convention used by older problems | [USACO rules](/reference/usaco-rules) |

Only the first two categories are genuinely reusable across every problem. The rest are patterns that you write once and then recognize when you need them, and the encyclopedia's articles are the better place to learn them, because each article explains why the code takes the shape it does.

## The starting template for each language

Each of these six programs reads a count, reads that many integers, prints their sum, and ends. They are complete and correct.

### C

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1 || n < 0) return 0;

    long long *values = malloc((size_t)n * sizeof *values);
    if (values == NULL) return 0;

    long long total = 0;
    for (long long i = 0; i < n; ++i) {
        if (scanf("%lld", &values[i]) != 1) break;
        total += values[i];
    }

    free(values);
    printf("%lld\n", total);
    return 0;
}
```

Every allocation has a matching release on every path, including the error paths, and the read of `n` is checked before it is used.

### C++17, convenience form

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    for (long long &x : a) cin >> x;

    long long answer = 0;
    for (long long x : a) answer += x;

    cout << answer << '\n';
    return 0;
}
```

**`#include <bits/stdc++.h>` is a GNU extension, not standard C++17.** It is a convenience header provided by the GNU C++ library that pulls in every standard header at once. It does not exist in Microsoft's compiler or in a libc++-only build, so code that depends on it stops compiling outside GCC. The umbrella header also defines names such as `index`, `div` and `time` in the global namespace, and it hides the fact that a file is missing a real include.

### C++17, standards-compliant form

```cpp
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    std::cin >> n;
    std::vector<long long> a(n);
    for (long long &x : a) std::cin >> x;

    long long answer = 0;
    for (long long x : a) answer += x;

    std::cout << answer << '\n';
    return 0;
}
```

This is the form to use if you want code that compiles anywhere, or if you are learning C++ properly. Add the explicit `#include` for each additional facility you use; the compiler tells you exactly which one is missing, and that is the moment the convention teaches you something.

### Java, with the fast scanner

```java
import java.io.IOException;

public class Main {
    private static final class FastScanner {
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int length = 0;

        private int read() throws IOException {
            if (pointer >= length) {
                length = System.in.read(buffer, 0, buffer.length);
                pointer = 0;
                if (length <= 0) return -1;
            }
            return buffer[pointer++] & 0xFF;
        }

        int nextInt() throws IOException {
            int c = read();
            while (c != -1 && c <= ' ') c = read();
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }
            int value = 0;
            while (c >= '0' && c <= '9') {
                value = value * 10 + (c - '0');
                c = read();
            }
            return sign * value;
        }
    }

    public static void main(String[] args) throws IOException {
        FastScanner fs = new FastScanner();

        int n = fs.nextInt();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = fs.nextInt();

        long answer = 0;
        for (long x : a) answer += x;

        System.out.println(answer);
    }
}
```

`java.util.Scanner` parses tokens with regular expressions and is roughly an order of magnitude slower than a buffered reader on an input of millions of tokens. The scanner above reads 64 KB blocks and parses the digits by hand. A submission must be a single file containing exactly one public class named `Main`, with no package declaration.

### Python

```python
import sys


def solve() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    total = 0
    for i in range(1, n + 1):
        total += int(data[i])

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    solve()
```

`sys.stdin.buffer.read().split()` reads the whole input as bytes and splits it on whitespace in one pass, which is the fastest available approach. It costs the memory of the whole input, which matters for $10^7$ tokens. `input()` in a loop is much slower, because it makes one call and one decode per line.

### Pascal

```pascal
program Main;
{$mode objfpc}{$H+}
uses SysUtils, Classes;

var
  Data: TStringList;
  N, I: LongInt;
  Total: Int64;
begin
  Data := TStringList.Create;
  try
    Data.LoadFromStream(StdIn);
    N := StrToIntDef(Data[0], 0);
    Total := 0;
    for I := 1 to N do
      Total := Total + StrToIntDef(Data[I], 0);
    WriteLn(Total);
  finally
    Data.Free;
  end;
end.
```

**Pascal is an educational reference only.** Pascal support has been discontinued by the competition, and no Pascal program can be submitted. This template exists so that you can read an algorithm expressed in Pascal and see how the same idea is shaped in a language with explicit arrays and no container library. The `{$mode objfpc}{$H+}` directives enable Free Pascal's object mode and long strings, and every Pascal program in this encyclopedia carries them.

### JavaScript

```javascript
const fs = require("node:fs");

function solve() {
    const data = fs.readFileSync(0, "utf8").split(/\s+/).filter(Boolean);
    if (data.length === 0) return;

    const n = Number(data[0]);
    let total = 0;
    for (let i = 1; i <= n; i += 1) total += Number(data[i]);

    process.stdout.write(`${total}\n`);
}

solve();
```

**JavaScript is an educational reference only.** It is not among the languages the competition accepts for submission. This template exists for the interactive demonstrations in this encyclopedia and for readers who want to see the same algorithm in a scripting runtime. Every JavaScript number is an IEEE 754 double, so integers beyond $2^{53} - 1$ cannot be represented exactly.

## The input and output convention

**The modern convention** is standard input and standard output. Since the December 2020 contest, the tasks have generally used this, and the templates above are written for it. A program reads tokens from standard input and writes the answer to standard output.

**The historical convention** is file-based. Older problems name an input file and an output file, and the program must open exactly those names. In C++17, the historical form is:

```cpp
#include <cstdio>
#include <iostream>
#include <vector>

int main() {
    std::freopen("example.in", "r", stdin);
    std::freopen("example.out", "w", stdout);

    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    std::cin >> n;
    std::vector<long long> a(n);
    for (long long &x : a) std::cin >> x;

    long long answer = 0;
    for (long long x : a) answer += x;

    std::cout << answer << '\n';
    return 0;
}
```

**The file names above are placeholders.** An archived problem may specify `cow.in` and `cow.out`, or `sample.in` and `sample.out`, or any other pair, and the names are case-sensitive: `cow.in` is not `Cow.in`. The specification of the problem is the only authority on which names to use, and the problem states which convention applies. Read it every time rather than assuming.

Two further details are worth carrying: the file names are relative to the working directory, so a complete path must not be given; and if a problem uses file input and output, output written to standard output is not graded.

## The contract of a template

Every template carries four obligations. Knowing them is what separates a template from a piece of memorized code.

| Question | What the answer tells you |
| --- | --- |
| **What does it assume?** | The input format, the constraint range, and the language standard it targets. A template that assumes one value per line is wrong for a problem that says otherwise. |
| **When does it help?** | The situation in which it saves more time than it costs in attention. The starting templates help on every problem; the graph templates help only when you have decided the problem is a graph problem. |
| **What does it cost?** | Space, time, and complexity in the code you have to read. A `std::unordered_map` with the standard integer hash costs $O(n)$ per operation under adversarial keys. A whole-table template costs $O(n)$ space even when the problem needs $O(1)$. |
| **What is the simpler alternative?** | The thing to reach for when the template is more machinery than the problem needs. A `std::vector` and a linear scan beat a Fenwick tree for a problem with one query. |

The last question is the one people skip, and it is the one that decides. A template that is never simpler than the alternative is a liability; a template that knows when to step aside is an asset.

## The bugs each template carries

These five are the recurring failures, and each of them has a fixed cause.

**Forgetting to disable the stream synchronization.** `std::cin` is synchronized with the C stdio functions by default, which means every read and every write pays for a flush of the other stream. On an input of millions of tokens the cost is large enough to turn a passing solution into a time-limit failure. The fix is `std::ios::sync_with_stdio(false);` and `std::cin.tie(nullptr);` as the first two statements of `main`. The symptom to watch for is a program that is fast on the sample and slow on the large test.

**Using `std::endl` where `'\n'` will do.** `std::endl` flushes the stream. In a loop that prints a million lines, that is a million flushes, and the cost is a function call and a write syscall per line rather than a buffered write. `'\n'` writes the newline character and leaves the buffering to the stream. The symptom is the same as the one above: fast on small inputs, slow on large ones.

**Reading with `Scanner` on large input.** `java.util.Scanner` splits the input with regular expressions, and it is roughly an order of magnitude slower than a hand-written buffered reader. On a Bronze problem with a few hundred integers it makes no difference. On a Gold problem with $2 \times 10^5$ integers it can be the difference between passing and failing, and the failure is reported as a time-limit exceeded on a program whose algorithm is entirely correct.

**Forgetting that a `long long` is needed.** The statement usually hints at the required width, but the hint is a hint rather than a guarantee. A count of pairs on $10^5$ elements is about $5 \times 10^9$, which does not fit in a signed 32-bit integer; a product of two values near $10^9$ is near $10^{18}$, which does not fit either. Use `long long` in C++, `long` in Java, and an unbounded integer in Python, and widen before you multiply rather than after: `1LL * a * b`, not `(long long)(a * b)`. The symptom is a wrong answer on exactly one test case, the largest one, and the value is usually a large negative number.

**Off-by-one errors in the input loop.** Reading `n` values in a loop that runs `n + 1` times leaves one stale value in the array; a loop that runs `n - 1` times silently drops the last value. Both compile, both run, and both produce a plausible answer. The guard is to write the loop bound from the specification rather than from memory, and to check the answer against a hand-computed case. A template that hides the loop behind a helper function can hide the bug with it, which is one argument for keeping the read loop visible in every solution you write.

## The exercise

Reproduce each of the six starting templates from memory, without looking at this page. Not the ideas: the programs.

1. Write the C template, including the `malloc` and the `free`, and compile it with warnings enabled.
2. Write the C++17 template twice, once with the umbrella header and once with the explicit include list, and confirm that both compile.
3. Write the Java template with the fast scanner, from the buffer field to the digit loop.
4. Write the Python template, and then replace the bulk read with a line-based read and measure the difference on a generated input of $10^6$ integers.
5. Write the Pascal template, and confirm that it reads tokens rather than lines.
6. Write the JavaScript template, and confirm that it prints the same answer as the Python one on the same input.

Then deliberately introduce each of the five bugs above into the language of your choice, confirm that the program still compiles, and confirm that each produces the symptom described above on an input you construct. A bug that you have caused once on purpose is a bug you will recognize when you cause it by accident.

Finally, write the file-based variant of the C++17 template, and then check the specification of a real archived problem to see which file names it actually requires.
