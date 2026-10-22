---
id: languages.cpp17
title: The C++17 center
summary: The standard library in detail, from fast input and output through the ordered and unordered containers, the priority queue, iterator invalidation, and the recursion limit that a graph traversal can hit.
division: []
subjects: [foundations]
level: intermediate
importance: core-prerequisite
keywords: [STL, vector, priority queue, fast io, iterator invalidation, lambda, C++17]
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

<Synonyms terms="C++, C plus plus, STL, standard template library, g++, competitive C++" />

C++ is the language most USACO competitors use, and it is the language in which the contest problem space is most completely covered by a standard library. Everything a contest needs: a growable array, an ordered map, a hash map, a priority queue, a sort, and a binary search, is in the standard, tested, and written to be fast.

C++ is a USACO submission language. This center describes the language as the C++17 standard defines it, and it marks the places where a GNU compiler offers something more convenient.

## Two templates

Every C++ program begins with the same fast input preamble. The first template is the GNU convenience form, and the second is the portable form. Both are complete programs.

### The GNU convenience template

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n) || n < 0) {
        return 0;
    }
    vector<int> values(n);
    for (int &value : values) {
        cin >> value;
    }

    sort(values.begin(), values.end());

    for (int i = 0; i < n; ++i) {
        cout << values[i] << (i + 1 == n ? '\n' : ' ');
    }
    if (n == 0) {
        cout << '\n';
    }
    return 0;
}
```

`<bits/stdc++.h>` is a GNU extension, not part of the standard. It exists because including every standard header costs compilation time, and a contest solution is compiled once. It is convenient, and it is not portable: a compiler that is not GCC or Clang will not find it.

`ios::sync_with_stdio(false)` detaches the C++ streams from the C streams, so a `cin` read does not first flush the C output buffer. `cin.tie(nullptr)` detaches `cin` from `cout`, so reading does not flush the output. Together they remove the per-operation flush that would otherwise dominate the running time of a program that alternates reads and writes.

### The standards-compliant template

```cpp
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    std::vector<int> values(static_cast<std::size_t>(n));
    for (int &value : values) {
        std::cin >> value;
    }

    std::sort(values.begin(), values.end());

    for (std::size_t i = 0; i < values.size(); ++i) {
        std::cout << values[i] << (i + 1 == values.size() ? '\n' : ' ');
    }
    if (values.empty()) {
        std::cout << '\n';
    }
    return 0;
}
```

Every header used is named explicitly, and every name is qualified with `std::`. Add `#include <queue>` for a priority queue, `#include <map>` for an ordered map, `#include <set>` for an ordered set, and `#include <unordered_map>` for a hash map.

### Why `'\n'` and not `std::endl`

`'\n'` writes a newline character and moves on. `std::endl` writes a newline character and then flushes the stream, which asks the operating system to push the bytes out. Flushing per line costs a write call per line, and a program that prints a million lines pays a million write calls for nothing.

Use `std::endl` only when the output must appear before the program continues, which in a contest means almost never. If you need a flush at the very end of the program, call `std::cout.flush()` once.

## The standard containers and their bounds

The bounds below are the ones the C++17 standard's complexity requirements give, for a container that holds $n$ elements. Where the standard says "amortised", the cost is the average over a sequence of operations rather than the cost of any single one.

| Container | Random access | Insert or erase at the end | Insert or erase in the middle | Lookup |
| --- | --- | --- | --- | --- |
| `std::vector` | $O(1)$ | $O(1)$ amortised | $O(n)$ | $O(n)$ |
| `std::deque` | $O(1)$ | $O(1)$ | $O(n)$ | $O(n)$ |
| `std::list` | $O(n)$ | $O(1)$ | $O(1)$ given the iterator | $O(n)$ |
| `std::set` | no | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ |
| `std::map` | no | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ |
| `std::unordered_set` | no | $O(1)$ average | $O(1)$ average | $O(1)$ average |
| `std::unordered_map` | no | $O(1)$ average | $O(1)$ average | $O(1)$ average |
| `std::priority_queue` | no | $O(\log n)$ for a push | not applicable | $O(1)$ for the top |

The hash containers are $O(1)$ on average and $O(n)$ in the worst case, because a hash table can degenerate when every key lands in the same bucket. The ordered containers are $O(\log n)$ in every case, and their iterators walk the tree in sorted order, which is what makes them the right choice when the algorithm needs the elements in order.

### `std::vector`

The default container, and the right one for almost every contest problem. It holds its elements in one contiguous block of memory, so a loop over it is a loop over an array.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values;
    values.reserve(1000);
    for (int i = 0; i < 1000; ++i) {
        values.push_back(i);
    }
    values[0] = 42;
    values.pop_back();
    std::cout << values.size() << ' ' << values.front() << '\n';
    return 0;
}
```

`reserve` is the single most useful `vector` method. Without it, each `push_back` that exceeds the capacity copies the whole vector, and the standard guarantees only amortised $O(1)$, not $O(1)$. With a `reserve` that is at least as large as the final size, every `push_back` is $O(1)$ and no copying happens at all.

### `std::array`, `std::deque`, `std::stack` and `std::queue`

`std::array<T, N>` is a fixed-size array with the same interface as a `vector` and no allocation. `std::deque` is a double-ended queue: it supports `push_front`, `push_back`, and random access, all in $O(1)$.

`std::stack` and `std::queue` are not containers. They are adapters that restrict a container to a discipline, and by default they are built on a `deque`.

```cpp
#include <deque>
#include <iostream>
#include <queue>
#include <stack>

int main() {
    std::stack<int> pending;
    pending.push(1);
    pending.push(2);
    std::cout << pending.top() << '\n';
    pending.pop();

    std::queue<int> queue;
    queue.push(3);
    std::cout << queue.front() << '\n';
    queue.pop();

    std::deque<int> deque;
    deque.push_front(1);
    deque.push_back(2);
    std::cout << deque.front() << deque.back() << '\n';
    return 0;
}
```

### `std::set`, `std::map`, `std::unordered_set` and `std::unordered_map`

An ordered set stores distinct elements in sorted order, and an ordered map stores key-value pairs in the order of the key. A hash set and a hash map store the same things without the order, at the cost of an $O(1)$ average lookup that can degrade to $O(n)$.

```cpp
#include <iostream>
#include <map>
#include <set>
#include <string>
#include <unordered_map>

int main() {
    std::set<int> ordered;
    ordered.insert(3);
    ordered.insert(1);
    ordered.insert(3);
    std::cout << ordered.size() << ' ' << *ordered.begin() << '\n';

    std::map<std::string, int> scores;
    scores["ada"] = 30;
    scores["bob"] = 10;
    for (const auto &entry : scores) {
        std::cout << entry.first << ' ' << entry.second << '\n';
    }

    std::unordered_map<int, int> counts;
    counts[7] = 1;
    counts[7]++;
    std::cout << counts[7] << '\n';
    return 0;
}
```

The iteration order of an ordered container is part of its contract, and the iteration order of a hash container is not. A program whose output depends on the order of an `unordered_map` is not portable, and a deterministic output is required by the published USACO instructions.

### `std::priority_queue`

A priority queue is a binary heap. It has a `top` element, and `push` and `pop` each cost $O(\log n)$. The default is a max-heap; the default comparator is `std::less`, so the largest element is on top.

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

int main() {
    // A min-heap: the smallest element is on top.
    std::priority_queue<int, std::vector<int>, std::greater<int>> min_heap;
    min_heap.push(5);
    min_heap.push(1);
    min_heap.push(3);
    std::cout << min_heap.top() << '\n';
    min_heap.pop();
    std::cout << min_heap.top() << '\n';

    // The default is a max-heap: the largest element is on top.
    std::priority_queue<int> max_heap;
    max_heap.push(5);
    max_heap.push(1);
    std::cout << max_heap.top() << '\n';
    return 0;
}
```

Two details matter. First, a priority queue has no way to change the priority of an element that is already inside it, so the standard technique for a decrease-key operation is to push a second entry and to discard the stale one when it surfaces. That keeps the queue at $O(E)$ entries instead of $O(V)$, and the discard test is a comparison against the current best distance.

Second, a priority queue of pairs orders by the first element, and ties are broken by the second, so `std::priority_queue<std::pair<long long, int>, std::vector<std::pair<long long, int>>, std::greater<>>` is a min-heap of (distance, vertex) pairs that is broken by the smaller vertex. That is usually the tie-break you want, because it makes the output deterministic.

## Sorting, comparators and lambdas

`std::sort` is an introsort: $O(n \log n)$ in the worst case, with a depth-limited quicksort that falls back to a heap sort, and it uses insertion sort on small ranges. `std::stable_sort` is $O(n \log n)$ and stable, at the cost of $O(n)$ extra memory. `std::partial_sort` sorts the first $k$ elements, in $O(n \log k)$.

The comparator is a function object, and a lambda is the shortest way to write one.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values = {5, 2, 9, 2, 7};

    std::sort(values.begin(), values.end());
    std::sort(values.begin(), values.end(), std::greater<int>());

    std::sort(values.begin(), values.end(), [](int a, int b) {
        return a % 10 < b % 10;
    });

    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
    return 0;
}
```

A comparator must be a strict weak ordering. It must return `false` when the two arguments are equivalent, and it must be antisymmetric. Returning `a < b` for one direction and `b < a` for the other, which looks symmetric and is not, is the classic bug: the standard does not check the comparator, and the result is undefined behavior.

Sorting a `vector` of structs with a member comparator is often clearer than sorting a vector of indices.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Contestant {
    std::string name;
    int score;
};

int main() {
    std::vector<Contestant> field = {{"ada", 30}, {"bob", 10}, {"cyd", 20}};
    std::sort(field.begin(), field.end(),
              [](const Contestant &a, const Contestant &b) {
                  if (a.score != b.score) {
                      return a.score > b.score;
                  }
                  return a.name < b.name;
              });
    for (const Contestant &contestant : field) {
        std::cout << contestant.name << ' ' << contestant.score << '\n';
    }
    return 0;
}
```

## Binary search

The standard library provides three binary searches over a sorted random access range, each $O(\log n)$.

`std::lower_bound` returns the first position at which the value could be inserted without breaking the order, which is the first element that is not less than the target. `std::upper_bound` returns the first position at which a value strictly greater than the target could be inserted, which is the first element greater than the target. `std::binary_search` returns a boolean.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values = {1, 3, 3, 5, 7};

    auto lower = std::lower_bound(values.begin(), values.end(), 3);
    auto upper = std::upper_bound(values.begin(), values.end(), 3);
    std::cout << (lower - values.begin()) << ' ' << (upper - values.begin())
              << '\n';

    if (std::binary_search(values.begin(), values.end(), 5)) {
        std::cout << "found\n";
    }
    return 0;
}
```

The difference `upper - lower` is the number of elements equal to the target, which is the count of occurrences. `std::equal_range` returns both iterators in one call and costs the same as the two separate calls.

These functions require the range to be sorted with respect to the same comparison the search uses. If you search with the default `<` a range sorted by a different comparator, the answer is meaningless.

## Pairs, tuples and structured bindings

`std::pair` holds two values of any types, `std::tuple` holds any number, and `std::get` selects by index. A C++17 structured binding destructures a pair, a tuple, or a struct into named variables.

```cpp
#include <iostream>
#include <string>
#include <tuple>
#include <utility>

int main() {
    std::pair<int, std::string> entry = {3, "three"};
    auto [number, word] = entry;
    std::cout << number << ' ' << word << '\n';

    std::tuple<int, double, char> values = {1, 2.5, 'x'};
    auto [first, second, third] = values;
    std::cout << first << ' ' << second << ' ' << third << '\n';

    std::cout << std::get<0>(entry) << ' ' << entry.second << '\n';
    return 0;
}
```

The declaration `auto [number, word] = entry;` copies. The declaration `auto &[number, word] = entry;` binds by reference, so writing to `number` writes to `entry`. The reference form matters when the pair is large or when it is an element of a container you are modifying.

The standard containers also give you their elements as pairs. A `std::map` iterator dereferences to a `std::pair<const Key, T>`, and a `std::set` iterator dereferences to its element type, so a structured binding works on both.

## Integer promotion and `long long`

The published USACO instructions state that `int` is 32 bits on the judge, and that a 64-bit integer needs a `long long`. Three rules decide what a C++ expression actually computes.

**Usual arithmetic conversions.** When two arithmetic operands have different types, the compiler converts both to a common type. The usual consequence is that a `char` or a `short` is promoted to `int` before the arithmetic, because `int` can hold every value of both. The consequence that bites is that mixing a signed and an unsigned operand converts the signed one to the unsigned type, so a negative number becomes a very large positive number.

```cpp
#include <iostream>
#include <limits>

int main() {
    int count = -1;
    unsigned int size = 1;
    // The usual arithmetic conversions turn the comparison into an unsigned
    // one, so -1 becomes a very large number and the comparison is false.
    std::cout << (static_cast<unsigned int>(count) < size) << '\n';

    // The literal 1000000000 * 10 overflows an int, so it is long long.
    std::cout << 1000000000LL * 10 << '\n';

    std::cout << std::numeric_limits<long long>::max() << '\n';
    return 0;
}
```

**Literal types.** A decimal integer literal that does not fit in an `int` has type `long`, and one that does not fit in a `long` has type `long long`. A floating literal such as `1e18` is a `double`, and a `double` has 53 bits of mantissa, so it cannot represent every large integer exactly. Write `1'000'000'000'000'000'000LL` instead, with the digit separators that C++14 introduced.

**Overflow is undefined.** A signed integer that overflows is undefined behavior, and the compiler is entitled to assume it does not happen. This is why `int` overflow in a contest program is a genuine bug and not a technicality.

The practical rule: use `int` for indices and counts, use `long long` for anything that is multiplied, accumulated, or compared against a distance, and cast to `long long` _before_ the multiplication, not after.

```cpp
#include <iostream>

int main() {
    int a = 100000;
    int b = 100000;
    // The product overflows an int: the cast must come first.
    long long product = 1LL * a * b;
    std::cout << product << '\n';
    return 0;
}
```

## Bit manipulation

Bit operations act on the value, not on the representation, and the result of a shift on a negative value or on a value that does not fit the type is undefined in C++17.

```cpp
#include <iostream>

int main() {
    int x = 12; // 1100 in binary

    std::cout << (x & 1) << '\n';       // the lowest bit
    std::cout << (x >> 2) << '\n';      // divide by four
    std::cout << (x | 1) << '\n';       // set the lowest bit
    std::cout << ((x & (x - 1)) == 0) << '\n'; // a power of two

    // 1 << 31 overflows an int, so the literal is unsigned or long long.
    unsigned long long high = 1ULL << 63;
    std::cout << high << '\n';
    return 0;
}
```

Three standard tricks cover most contest uses. `x & (x - 1)` clears the lowest set bit, so a loop that applies it repeatedly counts the set bits in $O(\log x)$ applications. `x & -x` isolates the lowest set bit, which is the key to the classic indexed binary heap. And a shift of one more than the width of the type is undefined, so never write `1 << 32` for an `int`; write `1ULL << 32` or `1LL << 32` and choose the type you meant.

Counting the set bits is where the standard and the extensions part ways. `std::popcount` was added in C++20, so in C++17 you write the loop yourself or use the GNU builtin.

```cpp
#include <iostream>

int main() {
    unsigned int x = 4294967295u;

    // Portable C++17: a loop that clears the lowest set bit each time.
    int portable = 0;
    for (unsigned int value = x; value != 0; value &= value - 1) {
        portable++;
    }

    // GNU extension, not standard C++17.
    int builtin = __builtin_popcount(x);

    std::cout << portable << ' ' << builtin << '\n';
    return 0;
}
```

## Iterator invalidation

Modifying a container can invalidate the iterators, pointers, and references into it, and the standard library will not check. The rules are specific, and the consequence of getting them wrong is a wrong answer rather than a crash.

| Modification | What is invalidated |
| --- | --- |
| `vector::push_back` when the capacity is exceeded | Every iterator, pointer, and reference into the vector |
| `vector::push_back` when the capacity suffices | Nothing |
| `vector::erase` | The erased element and everything after it; the end iterator |
| `vector::insert` | Everything from the insertion point onwards |
| `deque::insert` or `deque::push_front` | Every iterator, and the end iterator; references to elements are not invalidated |
| `map`, `set`: insert | Nothing |
| `map`, `set`: erase | The erased element's iterators only |
| `unordered_map`, `unordered_set`: insert causing a rehash | Every iterator; references to the elements remain valid |

The rule that catches people is the `vector` one, because the invalidation depends on the capacity, which depends on the history of the container.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values = {1, 2, 3};

    // Wrong: push_back may reallocate, and the iterator then dangles.
    // for (auto it = values.begin(); it != values.end(); ++it) {
    //     if (*it == 1) {
    //         values.push_back(9);
    //     }
    // }

    // Right: take the index, not the iterator.
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (values[i] == 1) {
            values.push_back(9);
        }
    }
    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
    return 0;
}
```

The same rule applies to a `std::map` whose value you want to change. Use `it->second = new_value` and never `insert` during the iteration, and remember that `map::operator[]` inserts a default-constructed value if the key is absent, which silently grows the map.

## Recursive and iterative traversal

The recursive form of a depth-first search is short, and the iterative form is safe. The two produce the same visit order if the iterative form pushes the neighbors in reverse order.

```cpp
#include <iostream>
#include <vector>

/* Recursive: the frame of the call stays on the stack while the subtree
   is explored, so the recursion depth equals the depth of the path. */
void dfs_recursive(const std::vector<std::vector<int>> &adj, int v,
                   std::vector<char> &visited, std::vector<int> &order) {
    visited[static_cast<std::size_t>(v)] = 1;
    order.push_back(v);
    for (int w : adj[static_cast<std::size_t>(v)]) {
        if (!visited[static_cast<std::size_t>(w)]) {
            dfs_recursive(adj, w, visited, order);
        }
    }
}

/* Iterative: the explicit stack replaces the call stack, so the depth of
   the traversal is bounded by the heap, not by the thread stack. */
std::vector<int> dfs_iterative(const std::vector<std::vector<int>> &adj,
                                int source) {
    std::vector<int> order;
    if (adj.empty() || source < 0 || source >= static_cast<int>(adj.size())) {
        return order;
    }
    std::vector<char> visited(adj.size(), 0);
    std::vector<int> stack{source};
    while (!stack.empty()) {
        const int v = stack.back();
        stack.pop_back();
        if (visited[static_cast<std::size_t>(v)]) {
            continue;
        }
        visited[static_cast<std::size_t>(v)] = 1;
        order.push_back(v);
        for (int w : adj[static_cast<std::size_t>(v)]) {
            if (!visited[static_cast<std::size_t>(w)]) {
                stack.push_back(w);
            }
        }
    }
    return order;
}

int main() {
    std::vector<std::vector<int>> adj(4);
    adj[0].push_back(1);
    adj[1].push_back(2);
    adj[2].push_back(0);

    std::vector<char> visited(adj.size(), 0);
    std::vector<int> order;
    dfs_recursive(adj, 0, visited, order);
    for (int v : order) {
        std::cout << v << ' ';
    }
    std::cout << '\n';

    for (int v : dfs_iterative(adj, 0)) {
        std::cout << v << ' ';
    }
    std::cout << '\n';
    return 0;
}
```

The iterative version here marks a vertex when it is popped, so a vertex can be pushed more than once. The stack therefore holds $O(E)$ entries in the worst case, not $O(V)$, and the auxiliary space is $O(V + E)$ rather than $O(V)$. Marking the vertex when it is pushed makes the stack hold $O(V)$ entries, at the price of a different visit order.

## Memory layout and performance

The layout of a container is the reason for its speed.

A `std::vector` is one contiguous block. Iterating it is a linear scan of memory, the hardware prefetcher works, and the elements are adjacent, so the cache line is used fully. A `std::map` is a node per element, each node holding a key, a value, and three pointers, and the tree is not contiguous, so every step of the traversal is a random memory access. A `std::unordered_map` is a bucket array of chains, and a lookup is one random access into the bucket array followed by a scan of a short chain.

Two consequences follow for contests. An `unordered_map` is usually faster than a `map` in practice, and a `map` is often faster in practice than an `unordered_map` whose keys are adversarial, because a `map` gives the same $O(\log n)$ bound whatever the keys are. And an adjacency list of `std::vector<std::vector<int>>` has one allocation per vertex, which costs time at construction; an adjacency list stored as a single flat array with a start index per vertex has one allocation in total and better locality.

The `std::vector<bool>` specialization deserves a warning. It stores its elements as bits, so `push_back` on a vector of booleans is much slower than on a vector of bytes, and the elements are not addressable. Use `std::vector<char>` instead.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<char> flags(1000000, 0);
    flags[999999] = 1;
    std::cout << static_cast<int>(flags[999999]) << '\n';
    return 0;
}
```

Reserving the exact capacity of a vector is the other cheap performance win. A vector that reallocates from size 1 to size $n$ copies a total of about $2n$ elements, which is $O(n)$ work that a `reserve` removes.

## Standard C++17 and compiler-specific extensions

Some of what a competitor uses every day is not in the standard. The distinction matters when you move code between a judge and your own machine, or when you read a solution written for a different compiler.

| Feature | Status |
| --- | --- |
| `<bits/stdc++.h>` | GNU and Clang extension |
| `__int128`, a 128-bit integer | GNU and Clang extension |
| `__builtin_popcount`, `__builtin_ctz`, `__builtin_clz` | GNU and Clang extension |
| `auto` in a range-based `for` | Standard since C++11 |
| Structured bindings | Standard since C++17 |
| `if` with an initializer | Standard since C++17 |
| `std::optional`, `std::variant` | Standard since C++17 |
| `std::gcd`, `std::lcm` | Standard since C++17 |
| `std::popcount` | Standard since C++20, so not available in C++17 |
| `std::string::contains` | Standard since C++20, so not available in C++17 |

The published USACO instructions state that programs are compiled with `g++` and that the standard is selected with `-std=c++11` or `-std=c++17`. Both of those compilers accept the GNU extensions, so the extensions work on the judge. They still break a program that is supposed to be portable, and the `__int128` type in particular is larger than the standard's widest integer, so a value stored in it cannot be printed with `std::cout` directly.

The C++17 features that are worth using are the structured bindings, the initializer in an `if` statement, `std::optional` for a value that may be absent, and `std::gcd` and `std::lcm` for number theory.

## Recursion in C++

A recursive call in C++ pushes a frame that holds the parameters and the locals, including the objects among them. The frame is larger than the equivalent frame in C, because a `std::string` or a `std::vector` in the body is not a pointer but a whole object with a size, a capacity, and possibly a heap block.

The limit is therefore a memory budget rather than a count. On a judge with the usual 8 MB thread stack, a frame of a hundred bytes gives about 80,000 frames and a frame of a few hundred bytes gives far fewer.

**A chain-shaped graph gives recursion depth proportional to the number of vertices**, so an $O(V + E)$ recursive depth-first search over a path on $10^5$ vertices overflows the stack even though its running time is linear. The time bound and the stack depth are separate resources, and a contest solution has to bound both.

The recommendation for C++ is therefore: **use recursion when the depth is provably small, and use an explicit stack otherwise.** The cases where recursion is safe are divide and conquer with depth $O(\log n)$, a traversal of a tree whose depth is bounded by a small constant, and a backtracking search whose depth is bounded by the size of the input structure. The cases where it is not safe are any traversal of an arbitrary graph, a depth-first search over a tree given in an unknown shape, and a recursion whose depth is the size of the input.

The cost of the iterative form is a few extra lines and a slightly less readable function. The cost of the recursive form, when it is wrong, is a runtime error that reports a stack overflow and not the line that caused it.

## Debugging advice

Compile with `-Wall -Wextra` while working, and add `-D_GLIBCXX_DEBUG` to turn on the standard library's own iterator and bounds checking. That macro makes the library verify that an iterator belongs to the container it is used with and that an index is inside the container, and it reports the offending line rather than corrupting the heap. It makes the program slower, so remove it before the final run.

A wrong answer in C++ is usually one of four things, and it is worth checking them in this order.

The first is an off-by-one in a half-open interval. A `vector` of size $n$ has valid indices $0$ through $n - 1$, and a range-based `for` visits all $n$ of them. When you see `i <= n` in a loop condition, that is the bug.

The second is an invalidated iterator, usually from a `push_back` inside a loop over the same vector.

The third is a comparator that is not a strict weak ordering, which the library does not diagnose and which produces a scrambled result rather than a crash.

The fourth is an integer overflow, which is undefined behavior and which the optimizer is allowed to use to remove your code. Compile with `-fsanitize=undefined` locally and the overflow becomes a diagnostic.

Print the input you parsed, not the answer you computed, when the two disagree. A parser bug and an algorithm bug look identical from the outside, and the cheapest way to separate them is to print the parsed values once the parsing is done.

## Template library

**A general program.** Read a count, read the values, solve, print.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 0) {
        return 0;
    }
    std::vector<long long> values(static_cast<std::size_t>(n));
    for (long long &value : values) {
        std::cin >> value;
    }

    std::sort(values.begin(), values.end());

    for (std::size_t i = 0; i < values.size(); ++i) {
        std::cout << values[i] << (i + 1 == values.size() ? '\n' : ' ');
    }
    if (values.empty()) {
        std::cout << '\n';
    }
    return 0;
}
```

**Graph input.** Read `n m`, then `m` edges, then a start vertex.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m) || n < 0 || m < 0) {
        return 0;
    }

    std::vector<std::vector<int>> adj(static_cast<std::size_t>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        if (!(std::cin >> u >> v)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[static_cast<std::size_t>(u)].push_back(v);
        adj[static_cast<std::size_t>(v)].push_back(u);
    }

    int source = -1;
    if (!(std::cin >> source)) {
        source = -1;
    }

    /* Solve the problem here, using adj and source. */

    return 0;
}
```

**Weighted graph input with a min-heap of distances.**

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m) || n < 0 || m < 0) {
        return 0;
    }

    std::vector<std::vector<std::pair<int, long long>>> adj(
        static_cast<std::size_t>(n));
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (!(std::cin >> u >> v >> w)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
            continue;
        }
        adj[static_cast<std::size_t>(u)].push_back({v, w});
        adj[static_cast<std::size_t>(v)].push_back({u, w});
    }

    int source = -1;
    if (!(std::cin >> source)) {
        source = -1;
    }

    using Entry = std::pair<long long, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> heap;
    std::vector<long long> distance(static_cast<std::size_t>(n), -1);
    if (source >= 0 && source < n) {
        distance[static_cast<std::size_t>(source)] = 0;
        heap.push({0, source});
    }

    while (!heap.empty()) {
        const Entry top = heap.top();
        heap.pop();
        const int v = top.second;
        if (top.first != distance[static_cast<std::size_t>(v)]) {
            // A shorter path was found after this entry was pushed.
            continue;
        }
        for (const auto &edge : adj[static_cast<std::size_t>(v)]) {
            const long long candidate = top.first + edge.second;
            if (distance[static_cast<std::size_t>(edge.first)] >= 0 &&
                candidate >= distance[static_cast<std::size_t>(edge.first)]) {
                continue;
            }
            distance[static_cast<std::size_t>(edge.first)] = candidate;
            heap.push({candidate, edge.first});
        }
    }

    for (std::size_t v = 0; v < distance.size(); ++v) {
        std::cout << distance[v] << (v + 1 == distance.size() ? '\n' : ' ');
    }
    if (distance.empty()) {
        std::cout << '\n';
    }
    return 0;
}
```

**An ordered map of counts, with a sorted output.**

```cpp
#include <iostream>
#include <map>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::map<long long, int> counts;
    long long value = 0;
    while (std::cin >> value) {
        counts[value]++;
    }

    for (const auto &entry : counts) {
        std::cout << entry.first << ' ' << entry.second << '\n';
    }
    return 0;
}
```

## What to remember

C++ gives you a container for every problem in this encyclopedia, and it gives it to you in $O(\log n)$ or $O(1)$ rather than in $O(n)$.

The three habits that pay for themselves are these. Reserve the capacity of a vector when you know it. Use `'\n'` rather than `std::endl`. And bound the depth of your recursion separately from the time it takes, because a linear algorithm can still crash on a linear input.
