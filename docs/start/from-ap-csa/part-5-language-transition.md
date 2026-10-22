---
id: start.language-transition
title: Programming language transition
summary: Moving between the six languages A.A.Y.N.T.N. covers, with the Java to C++17 equivalence table and the warnings that save a contest.
division: []
subjects: [foundations]
level: introductory
importance: core-prerequisite
keywords: [c++, stl, pointers, boxing, fast io, bigint, stack limits]
prerequisites:
    required: []
    recommended:
        [
            start.computational-foundations,
            languages.c,
            languages.cpp17,
            languages.java,
            languages.python,
            languages.pascal,
            languages.javascript,
        ]
reviewed: false
draft: false
---

Part 5 is the bridge. If you arrive from AP Computer Science A, Java is what you know, and Java is a perfectly good language for learning algorithms. It is also not the language most competitors use, and the gap between the two is made of concrete, mechanical differences that this part enumerates.

The ten modules below cover the transition itself, the container vocabulary, the semantics that catch people out, the four languages you are most likely to meet, and the two topics that decide more contests than any algorithm: fast input and memory limits.

<Synonyms terms="language comparison, java to c++, stl, language reference, idioms" />

## 5.1 From Java to C++17

C++17 is a larger language than Java in surface area and a less opinionated one in style. The differences that matter in a contest fall into four groups.

**Types are explicit.** Java's `int` is always 32 bits and `long` is always 64 bits. In C++, `int` is at least 16 bits and is 32 on every platform you will meet, but `long` is only guaranteed 32 bits. If you want 64 bits, write `long long` or `int64_t`. Contest code that assumes `long` is 64 bits is wrong, and the error shows up as an overflow on a large input rather than as a compile error.

**Memory is yours to manage.** Java allocates objects on the heap and never frees them; the garbage collector does it. C++ gives you `new`, `delete`, `std::vector`, `std::string`, and every standard container, each of which owns its memory and releases it when the object goes out of scope. This is more work and it is also faster, because the memory is laid out exactly as you asked for it.

**Header files and namespaces.** Java's `java.util` is always available. C++ requires `#include` for everything, and the standard library lives in the namespace `std`. You either qualify every name with `std::` or you write `using namespace std;`, which is conventional in contest code and is mildly discouraged elsewhere.

**Iteration and templates.** Java's enhanced for loop has one shape. C++17 has the range-based for loop, which is the direct equivalent, plus the whole template machinery, which is what makes the standard containers composable.

<MathPanel type="counterexample" title="The 64-bit trap">
In C++, `long` is 64 bits on Linux and macOS when compiled with the
LP64 model, and 32 bits on Windows with the LLP64 model. Code that
computes `long long x = a * b;` where `a` and `b` are `int` is doubly
wrong: the multiplication is performed in `int` and overflows before the
result is widened. The fix is to make one operand a 64-bit type before
multiplying.
</MathPanel>

**Worked example.** The same loop in both languages:

```java
for (int i = 0; i < n; i++) {
    total += a[i] * (long) b[i];
}
```

```cpp
for (int i = 0; i < n; ++i) {
    total += 1LL * a[i] * b[i];
}
```

The `1LL` forces the multiplication into 64-bit arithmetic. The Java cast does the same job.

**What you must get right.** Use `long long` for any value that can exceed $2^{31}-1$, and widen _before_ multiplying, not after. C++ is not Java with different syntax, and the difference in integer width is the first place a ported solution goes wrong.

### Checkpoint

**Conceptual.**

1. Give three concrete differences between Java and C++17 that change the meaning of correct code rather than only its syntax.
2. Explain why `long` is not a safe stand-in for `long long` in C++, and why `1LL * a * b` differs from widening the result afterwards.
3. Explain what the garbage collector does for you in Java and what `std::vector` and `std::string` do for you in C++.

**Code reading.**

1. This Java code is correct. Say what the C++17 translation must change to remain correct, and why:

    ```java
    long total = 0;
    for (int i = 0; i < n; i++) total += a[i] * b[i];
    ```

2. This C++ code compiles but produces a wrong answer on large inputs. Say exactly why, and give the fix:

    ```cpp
    long long total = 0;
    for (int i = 0; i < n; ++i) total += a[i] * b[i];
    ```

**Implementation.** Write a C++17 program that reads $n$ and then $n$ pairs of integers and prints the sum of their products. Verify it against the Java version of the same program on the same input, and state the maximum value of the sum for which both agree.

**Applied problem.** A Java solution you wrote passes the sample tests but fails on the largest test case. List three C++-specific or Java-specific reasons this could happen, and say which one you would check first.

## 5.2 Collections versus STL containers

The Java collections framework and the C++ standard template library overlap heavily but not exactly.

| Java | C++17 | Notes |
| --- | --- | --- |
| `ArrayList<T>` | `std::vector<T>` | contiguous, random access, amortised append |
| `LinkedList<T>` | `std::list<T>` | rarely the right answer |
| `HashMap<K,V>` | `std::unordered_map<K,V>` | expected $O(1)$, adversarial risk |
| `TreeMap<K,V>` | `std::map<K,V>` | sorted, $O(\log n)$, no adversarial risk |
| `HashSet<T>` | `std::unordered_set<T>` | expected $O(1)$ |
| `TreeSet<T>` | `std::set<T>` | sorted, $O(\log n)$ |
| `ArrayDeque<T>` | `std::deque<T>` | both ends, $O(1)$ |
| `PriorityQueue<T>` | `std::priority_queue<T>` | max-heap by default |
| `Stack<T>` | `std::stack<T>` | adaptor over `std::deque` |
| `Queue<T>` | `std::queue<T>` | adaptor over `std::deque` |
| `Collections.sort(list)` | `std::sort(v.begin(), v.end())` |  |
| `Arrays.sort(arr)` | `std::sort(arr, arr + n)` |  |
| `Collections.reverse(list)` | `std::reverse(v.begin(), v.end())` |  |
| `Arrays.asList(a)` | `std::vector<T>(a, a + n)` |  |
| `BitSet` | `std::bitset<N>` | fixed size |

Two differences bite hardest.

**Iterators versus indexes.** The Java collections return iterators; the STL containers are themselves iterable. The equivalent of Java's `for (T x : list)` is C++'s `for (auto& x : v)`, and the equivalent of `list.get(i)` is `*std::next(v.begin(), i)`, which is slow. Contiguous indexing in C++ is `v[i]`, and it is only available on the random-access containers.

**Insertion and erasure semantics.** In a `std::vector`, inserting at position $k$ shifts the remaining elements, so it costs $O(n)$. The same operation on a `std::list` costs $O(1)$ but costs $O(n)$ to reach position $k$. Neither container is uniformly better; the choice depends on the access pattern.

**Worked example.** Java's `TreeMap` is `std::map`, and the reason to choose `std::map` over `std::unordered_map` in a contest is not aesthetics: `std::unordered_map` with `std::hash<int>` is the identity function, and an adversarial test can make every key collide. `std::map` costs $O(\log n)$ per operation and has no such failure mode.

**What you must get right.** Reach for `std::vector` first. Most contest problems need a contiguous array with random access, and everything else is a special case. Reach for `std::map` when you need sorted order or when the input can be adversarial, and for `std::unordered_map` only when you have mixed in a randomised hash.

### Checkpoint

**Conceptual.**

1. Give the C++17 equivalent of `HashMap`, `TreeMap`, `PriorityQueue` and `ArrayDeque`, and say when you would pick the ordered map over the hash map in a contest.
2. Explain why the Java collections return iterators while the standard template library containers are themselves iterable, and what that changes about how you index into them.
3. Compare the cost of inserting at the middle of a `std::vector` with the cost of doing the same in a `std::list`, and say which one you would choose for random access.

**Code reading.**

1. This Java code is the reference solution for a problem that allows adversarial input. Say what would happen to its runtime if you translated it to `std::unordered_map` with the standard hash, and give the two fixes:

    ```java
    Map<Integer, Integer> counts = new HashMap<>();
    for (int x : a) counts.merge(x, 1, Integer::sum);
    ```

2. This C++ code has a performance problem that the Java original does not. Say what it is:

    ```cpp
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : edges) { adj[u].push_back(v); adj[v].push_back(u); }
    ```

**Implementation.** Write a function that reads $n$ integers and returns the $k$ smallest of them in sorted order, first with a `std::vector` and then with a `std::priority_queue`. Report the time complexity of each and the number of comparisons each performs.

**Applied problem.** A problem needs, for each key, the list of values associated with it, and the keys must be output in sorted order. Give the container you would use, the alternative you would reject, and the reason for the rejection.

## The Java to C++17 equivalence table

This is the reference table for the transition. It is organized by the kind of construct, and it lists the Java form, the C++17 form, and the difference that bites.

**Primitive types and limits.**

| Java | C++17 | Note |
| --- | --- | --- |
| `int` | `int` | 32 bits on every contest platform |
| `long` | `long long` | Java's `long` is 64 bits; C++'s `long` is not guaranteed to be |
| `short` | `short` |  |
| `byte` | `signed char`, `int8_t` |  |
| `char` | `char` | Java's `char` is unsigned 16-bit UTF-16 code units |
| `boolean` | `bool` |  |
| `double` | `double` | IEEE 754 in both |
| `float` | `float` |  |
| `Integer.MAX_VALUE` | `std::numeric_limits<int>::max()` |  |
| `Integer.MIN_VALUE` | `std::numeric_limits<int>::min()` |  |
| `Long.MAX_VALUE` | `std::numeric_limits<long long>::max()` |  |
| `Double.POSITIVE_INFINITY` | `std::numeric_limits<double>::infinity()` |  |
| `null` | `nullptr` |  |

**Arrays.**

| Java | C++17 | Note |
| --- | --- | --- |
| `int[] a = new int[n]` | `std::vector<int> a(n)` | zero-initialized in both |
| `int[] a = {1, 2, 3}` | `std::vector<int> a{1, 2, 3}` |  |
| `a.length` | `a.size()` | `size()` returns `size_t`, unsigned |
| `new int[2][3]` | `std::vector<std::vector<int>>` | not a true 2-D array |
| `Arrays.fill(a, v)` | `std::fill(a.begin(), a.end(), v)` |  |
| `Arrays.copyOf(a, n)` | `std::vector<int> b(a.begin(), a.begin() + n)` |  |
| `System.arraycopy(a, 0, b, 0, n)` | `std::copy(a.begin(), a.end(), b.begin())` |  |
| `a.clone()` | `std::vector<int> b(a)` | copies, as in Java |

**Strings.**

| Java | C++17 | Note |
| --- | --- | --- |
| `String s = "x"` | `std::string s = "x"` |  |
| `s.length()` | `s.size()` |  |
| `s.charAt(i)` | `s[i]` |  |
| `s.substring(a, b)` | `s.substr(a, b - a)` | the second argument is the _length_ in C++ |
| `s.indexOf("x")` | `s.find("x")` | `std::string::npos` when absent |
| `s.contains("x")` | `s.find("x") != std::string::npos` |  |
| `s.startsWith("x")` | `s.rfind("x", 0) == 0` |  |
| `s.endsWith("x")` | `s.size() >= 1 && s.compare(s.size() - 1, 1, "x") == 0` |  |
| `s.equals(t)` | `s == t` |  |
| `s.compareTo(t)` | `s.compare(t)` |  |
| `s.toUpperCase()` | `std::toupper` on each character |  |
| `s.trim()` | `s.find_first_not_of(" \t\r\n")` |  |
| `s.replace(a, b)` | `s.replace(pos, len, b)` | positional, not global |
| `s.split(" ")` | hand-written tokeniser | no built-in equivalent |
| `StringBuilder sb` | `std::string s` with `+=` |  |
| `sb.append(x)` | `s += x` |  |
| `Integer.parseInt(s)` | `std::stoi(s)`, `std::stoll(s)` |  |
| `Double.parseDouble(s)` | `std::stod(s)` |  |
| `String.valueOf(x)` | `std::to_string(x)` |  |

**Collections and algorithms.**

| Java | C++17 | Note |
| --- | --- | --- |
| `ArrayList<T>` | `std::vector<T>` | contiguous, random access |
| `LinkedList<T>` | `std::list<T>` |  |
| `HashMap<K, V>` | `std::unordered_map<K, V>` | expected $O(1)$, adversarial risk |
| `TreeMap<K, V>` | `std::map<K, V>` | sorted, $O(\log n)$ |
| `HashSet<T>` | `std::unordered_set<T>` |  |
| `TreeSet<T>` | `std::set<T>` |  |
| `ArrayDeque<T>` | `std::deque<T>` |  |
| `PriorityQueue<T>` | `std::priority_queue<T>` | max-heap in both |
| `Stack<T>` | `std::stack<T>` | adaptor over `std::deque` |
| `Queue<T>` | `std::queue<T>` | adaptor over `std::deque` |
| `list.size()` | `v.size()` |  |
| `list.isEmpty()` | `v.empty()` |  |
| `list.add(x)` | `v.push_back(x)` |  |
| `list.get(0)` | `v.front()` |  |
| `list.remove(0)` | `v.erase(v.begin())` | $O(n)$ in both |
| `map.get(k)` | `m.at(k)`, `m.find(k)` | `at` throws, `find` returns an iterator |
| `map.put(k, v)` | `m[k] = v` |  |
| `map.containsKey(k)` | `m.count(k) > 0` |  |
| `map.remove(k)` | `m.erase(k)` |  |
| `map.keySet()` | iterate `m` and use `.first` |  |
| `map.entrySet()` | `for (auto& [k, v] : m)` | structured bindings |
| `Collections.sort(list)` | `std::sort(v.begin(), v.end())` |  |
| `list.sort(cmp)` | `std::sort(v.begin(), v.end(), cmp)` |  |
| `Collections.reverse(list)` | `std::reverse(v.begin(), v.end())` |  |
| `Collections.max(list)` | `*std::max_element(v.begin(), v.end())` |  |
| `Collections.min(list)` | `*std::min_element(v.begin(), v.end())` |  |
| `Collections.shuffle(list)` | `std::shuffle(v.begin(), v.end(), rng)` |  |
| `Arrays.asList(a)` | `std::vector<T>(a, a + n)` |  |
| `BitSet` | `std::bitset<N>` | fixed size |

**Mathematics and bit manipulation.**

| Java | C++17 | Note |
| --- | --- | --- |
| `Math.max(a, b)` | `std::max(a, b)` | both arguments must have the same type |
| `Math.min(a, b)` | `std::min(a, b)` |  |
| `Math.abs(a)` | `std::abs(a)` | check the overload matches the type |
| `Math.pow(x, y)` | `std::pow(x, y)` |  |
| `Math.sqrt(x)` | `std::sqrt(x)` |  |
| `Math.floor(x)` | `std::floor(x)` |  |
| `Math.ceil(x)` | `std::ceil(x)` |  |
| `Math.round(x)` | `std::round(x)` | C++ rounds halfway cases away from zero |
| `Math.log(x)` | `std::log(x)` | natural logarithm in both |
| `Math.floorMod(a, b)` | `((a % b) + b) % b` | for negative `a` |
| `Math.floorDiv(a, b)` | `a / b` adjusted for remainder sign |  |
| `Integer.bitCount(x)` | `__builtin_popcount`, `__builtin_popcountll` | GNU extension |
| `Integer.numberOfTrailingZeros(x)` | `__builtin_ctz` | undefined for zero |
| `Integer.highestOneBit(x)` | `1 << (31 - __builtin_clz(x))` | GNU extension |
| `Integer.toBinaryString(x)` | `std::bitset<64>(x).to_string()` |  |

**Input and output.**

| Java | C++17 | Note |
| --- | --- | --- |
| `new Scanner(System.in)` | `std::cin` | or a hand-written fast reader |
| `sc.nextInt()` | `std::cin >> x` |  |
| `sc.next()` | `std::cin >> s` |  |
| `sc.nextLine()` | `std::getline(std::cin, s)` |  |
| `BufferedReader br` | `std::getline` with `std::istringstream` |  |
| `System.out.println(x)` | `std::cout << x << '\n'` |  |
| `System.out.print(x)` | `std::cout << x` |  |
| `System.err.println(x)` | `std::cerr << x << '\n'` |  |

**Language constructs.**

| Java | C++17 | Note |
| --- | --- | --- |
| `if (x) ... else ...` | identical |  |
| `for (int i = 0; i < n; i++)` | `for (int i = 0; i < n; ++i)` |  |
| `for (T x : list)` | `for (auto& x : v)` | `const auto&` to avoid copies |
| `while`, `do ... while` | identical |  |
| `switch` | `switch` | no switch _expressions_ before C++23 |
| `break`, `continue` | identical |  |
| `class` | `class` or `struct` | `class` defaults to private members |
| `interface` | abstract class with pure virtual methods |  |
| `extends` | `:` after the class name |  |
| `implements` | `:` after the class name |  |
| `abstract void f()` | `virtual void f() = 0` |  |
| `final` | `final` |  |
| `static` | `static` |  |
| `private`, `public`, `protected` | identical |  |
| `super.f()` | `Base::f()` |  |
| `this` | `this->` for members |  |
| `try` / `catch` / `finally` | identical |  |
| `throw new E()` | `throw E()` |  |
| `x instanceof Y` | `dynamic_cast<Y*>(x)` |  |
| `Comparable` | `operator<` |  |
| `Comparator` | a lambda or a function object |  |
| `enum` | `enum class` | scoped, no implicit conversion |
| `varargs` | a template parameter pack |  |
| `String[] args` | `int argc, char** argv` |  |

## 5.3 Value and reference semantics in C++

C++ gives you four parameter kinds, and choosing between them is one of the most consequential decisions in a performance-sensitive program.

| Signature            | Copies? | Mutates the caller's object? |
| -------------------- | ------- | ---------------------------- |
| `void f(T x)`        | yes     | no                           |
| `void f(T& x)`       | no      | yes                          |
| `void f(const T& x)` | no      | no                           |
| `void f(T* x)`       | no      | yes, through the pointer     |

The rule of thumb from module 1.7 applies with more force in C++, because the default is a copy.

**Worked example.** Consider a function that appends a value to a vector:

```cpp
void addOne(std::vector<int> v) { v.push_back(1); }        // copies, lost
void addOneRef(std::vector<int>& v) { v.push_back(1); }    // mutates
```

In a loop of $10^5$ iterations over a vector of $10^5$ integers, the first version copies $10^{10}$ integers. The second copies nothing. The asymptotic complexity of the loop changes from $\Theta(n^2)$ to $\Theta(n)$, and the fix is one character.

**The same issue with iterators and the `auto` trap.** `for (auto x : v)` copies each element; `for (const auto& x : v)` does not. On a vector of a large struct, the difference is the difference between $O(n)$ copies and none.

**The return value.** Returning a container by value in modern C++ is cheap: the standard mandates copy elision for the return of a temporary, so `std::vector<int> f()` returns without a copy in C++17. Returning `const std::vector<int>` by value is a pessimisation, because it suppresses moves.

**What you must get right.** Use `const T&` for read-only access to anything expensive, `T&` when you mean to mutate, and `T` only for small types or when a copy is the intent. In a contest, a function taking a `std::vector<int>` by value in a hot loop is a time-limit bug waiting to happen.

### Checkpoint

**Conceptual.**

1. State the four parameter kinds in C++ and, for each, whether it copies and whether it can mutate the caller's object.
2. Explain why `for (auto x : v)` can be much slower than `for (const auto& x : v)`.
3. Explain why returning a container by value is cheap in C++17, and why returning it as `const` is not.

**Code reading.**

1. This function is called $10^5$ times on a vector of $10^5$ integers. Say what the total cost is, and give the signature you would use instead:

    ```cpp
    void addOne(std::vector<int> v) { v.push_back(1); }
    ```

2. This code is correct but slow. Say why, and rewrite the loop header:

    ```cpp
    for (auto item : expensiveItems) { total += item.cost(); }
    ```

**Implementation.** Write three overloads of a function that takes a container: one by value, one by reference, and one by const reference. Call each with a vector of a million elements and measure the elapsed time of each call. Report the three measurements and explain them.

**Applied problem.** A solution passes a `std::vector<std::string>` to a helper function once per query, with $10^5$ queries. Give the asymptotic cost of the original, the cost after you change the parameter to a const reference, and the cost after you change the caller to hoist the call out of the loop.

## 5.4 C arrays, pointers and manual memory

C gives you arrays and pointers, and C++ inherits both. An array is a contiguous block of memory with a fixed size; a pointer is an address. The array-to-pointer decay rule means that a C array passed to a function arrives as a pointer to its first element, and the size is lost.

```c
void process(int *a, int n);      /* correct: size passed explicitly */
void process(int a[]);             /* broken: size is unknown */
```

In C++ you should almost never use raw arrays or `new`/`delete`. Use `std::vector`, `std::string`, `std::unique_ptr` and `std::vector<std::unique_ptr<T>>`. The reason is not style. `new` and `delete` do not compose with exceptions: if an exception is thrown between a `new` and its `delete`, the memory leaks, and a leak in a contest is a memory-limit failure. The standard containers are exception-safe, and `std::unique_ptr` frees its object when it goes out of scope.

**Why it matters.** C is one of the four languages USACO accepts, and it is the fastest of them for tight loops. It is also the easiest to get memory handling wrong in.

**Worked example.** A C program that reads $n$ integers and prints their sum, with the cleanup path explicit:

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1 || n < 0) return 0;

    long long *values = malloc((size_t)n * sizeof *values);
    if (values == NULL) return 0;

    long long sum = 0;
    for (long long i = 0; i < n; i++) {
        if (scanf("%lld", &values[i]) != 1) break;
        sum += values[i];
    }
    free(values);
    printf("%lld\n", sum);
    return 0;
}
```

Every allocation has a documented cleanup path, and the allocation is checked.

**What you must get right.** Every `malloc` needs a matching `free` on every path, including the error paths. In C++, prefer `std::vector` and `std::string` to raw allocation entirely, and use `std::unique_ptr` when you need ownership semantics.

## 5.5 Python lists, dictionaries and tuples

Python's built-in containers are good, and one of them is quietly slow.

A `list` is a dynamic array: a contiguous block of pointers to objects. Appending is amortised $O(1)$ because the array grows geometrically. Indexing is $O(1)$. But `list.pop(0)`, `list.insert(0, x)` and `list.remove(x)` are all $O(n)$, because every element after the position must shift. For a queue, use `collections.deque`, whose `popleft` and `append` are both $O(1)$.

A `dict` is a hash table with open addressing and a compact layout. Its lookup is expected $O(1)$, its insertion is amortised $O(1)$, and its iteration order is insertion order, guaranteed since Python 3.7. Its keys must be hashable, so a `list` cannot be a key and a `tuple` can.

A `tuple` is an immutable sequence stored inline. It is hashable, it is cheaper than a list, and it is the natural key for a dictionary when the key is a pair or a triple.

**Why it matters.** The performance traps in Python are not the algorithm; they are the constant factor of the container.

**Worked example.** Counting with a `defaultdict` is faster than counting with a plain dictionary, because the latter pays for a lookup and an insertion for each occurrence while the former pays for one.

```python
from collections import defaultdict, deque

counts = defaultdict(int)
for token in tokens:
    counts[token] += 1

queue = deque()
queue.append(item)
head = queue.popleft()
```

**What you must get right.** Never use `list.pop(0)` in a loop; it makes the loop quadratic. Never use `list` as a dictionary key; use a `tuple`. And when the input is large, read it as `sys.stdin.buffer.read().split()` rather than with `input()` in a loop, which is one call per line and much slower.

## 5.6 Java primitive collections and boxing costs

Java's generics cannot hold primitives, so `List<Integer>` holds references to `Integer` objects. Adding a primitive to such a list _boxes_ it: the compiler inserts a call to `Integer.valueOf`, which allocates an object, except for the small values from $-128$ to $127$, which are cached and reused.

The consequences compound. An `ArrayList<Integer>` of $10^6$ elements holds $10^6$ pointers, 8 bytes each on a 64-bit JVM, plus the boxed `Integer` objects themselves at 16 bytes each, so 24 MB for data that could be 4 MB in a primitive array. Each box also costs an allocation and a garbage collection cycle.

The standard libraries for primitive data exist for exactly this reason: `IntStream`, `LongStream`, `DoubleStream`, and the primitive specializations `IntArrayList` in the fastutil library. And `Arrays.sort(int[])` sorts primitives with no boxing at all, while `Collections.sort(List<Integer>)` sorts boxed objects with a comparator that unboxes every comparison.

**Why it matters.** This is the largest single source of the gap between a Java solution and a C++ solution of the same algorithm. The algorithm is identical; the constant factor is not.

**Worked example.** Summing a list of $10^6$ boxed integers with a `for` loop over the `List<Integer>` costs a virtual call and an unboxing per element. Summing an `int[]` with an indexed loop costs a bounds check and an array load. Both are $O(n)$, and the second is several times faster.

**What you must get right.** When the values are known to be integers, use a primitive array or an `IntStream`, not a boxed collection. And when you need a map from an integer key to an integer value, remember that `HashMap<Integer, Integer>` boxes both the key and the value on every access.

## 5.7 Pascal arrays, sets, records and procedures

Pascal is the fourth of the classic contest languages, and it appears in this encyclopedia as an educational reference rather than as a submission language. Its model is nonetheless worth a module, because it is different from the others in instructive ways.

**Arrays** come in two forms. A _static_ array is declared with fixed bounds, `array[1..1000] of Integer`, and its size is part of its type. A _dynamic_ array is declared `array of T` and resized with `SetLength`, which copies the contents when it grows, so the same amortised-append argument applies as for a Java `ArrayList`.

**Sets** are a built-in collection of a small ordinal domain, and in Free Pascal a set of up to 256 elements is stored as a bit mask. This is exactly the subset-enumeration trick of module 1.6, built into the language.

**Records** are the value type: a record variable holds the fields themselves, and assigning one record to another copies every field. There is no boxing of the whole record, and a record containing a dynamic array copies the array too, which is the classic surprise.

**Procedures and functions** are Pascal's subroutines, and `var` versus value parameters control whether a parameter is copied, exactly as reference versus value parameters do elsewhere.

```pascal
program Demo;
{$mode objfpc}{$H+}
uses SysUtils;
type
  TPoint = record
    X, Y: Integer;
  end;
var
  Counts: array of Integer;
begin
  SetLength(Counts, 10);
  Counts[0] := 1;
  WriteLn(Counts[0]);
end.
```

The `{$mode objfpc}{$H+}` directives enable Free Pascal's object mode and long strings, and every Pascal program in this encyclopedia carries them.

**What you must get right.** Records are copied on assignment, so passing a record to a procedure copies it unless the parameter is declared `var`. And a dynamic array inside a record is copied with the record, which turns an $O(1)$ pass into an $O(n)$ pass.

## 5.8 JavaScript numbers, BigInt, arrays and Maps

JavaScript has one numeric type for ordinary arithmetic: `Number`, which is an IEEE 754 double. Every integer is a double, so `Number.MAX_SAFE_INTEGER` is $2^{53}-1 = 9007199254740991$, and beyond that, integers cannot be represented exactly. `0.1 + 0.2 !== 0.3` in JavaScript for the same reason it is true in C++.

For larger integers, `BigInt` is a separate type with arbitrary precision. It does not coerce with `Number`, so mixing them throws a `TypeError`, and `BigInt` arithmetic is markedly slower. The contest pattern is to keep every value in `BigInt` once you know you need it, or to use `Number` and stay below $2^{53}$.

Bitwise operations in JavaScript convert their operands to 32-bit _signed_ integers. `>>` is a signed shift, `>>>` is an unsigned shift, and `<<` produces a signed 32-bit result. So `1 << 31` is $-2147483648$, not $2147483648$.

**Arrays** in JavaScript are not contiguous memory. An array is an object with integer-keyed properties, and the engine stores small dense arrays in a fast path but falls back to a dictionary representation for sparse or mixed arrays. `arr.push` is amortised $O(1)$ in the fast path.

**Map and Set** preserve insertion order, accept keys of any type, and have expected $O(1)$ operations. A plain object coerces its keys to strings, so `obj[1]` and `obj["1"]` are the same property, while `map.set(1, x)` and `map.set("1", x)` are different entries.

**Why it matters.** JavaScript is not a USACO submission language, but it is the language of the interactive demonstrations in this encyclopedia, and the same reasoning about numbers and containers applies to any JavaScript you write.

**Worked example.** A common bug is using `>>` where `>>>` is meant:

```javascript
const mask = (1 << 31) >>> 0; // 2147483648, an unsigned 32-bit value
const wrong = 1 << 31; // -2147483648
```

**What you must get right.** Use `BigInt` for anything beyond $2^{53}-1$, use `>>>` for unsigned right shifts, and use `Map` rather than a plain object when the keys are not strings. And never mix `BigInt` and `Number` in an arithmetic expression.

## 5.9 Fast input and output in each language

Every contest language needs a fast reader, and the standard library's default is usually too slow for a large input.

**C++.** `std::cin` is synchronized with the C stdio functions by default, which is slow; call `std::ios::sync_with_stdio(false)` and `std::cin.tie(nullptr)` first. That alone is usually enough. For very large inputs, write a reader that pulls 64 KB blocks with `fread` and parses integers by hand.

**Java.** `java.util.Scanner` parses tokens with regular expressions and is far slower than a buffered reader, by roughly an order of magnitude on an input of millions of tokens. Use `BufferedInputStream` with a manual byte scanner, or `java.io.BufferedReader` with `String.split` when the input is moderate. The A.A.Y.N.T.N. reference implementations all use a hand-written `FastScanner` over a 64 KB buffer.

**Python.** `sys.stdin.buffer.read().split()` reads the whole input as bytes and splits it on whitespace in one pass. It is the fastest available approach and it costs the memory of the whole input, which for $10^7$ tokens is a serious consideration. `input()` in a loop is much slower because it makes one call and one decode per line.

**C.** `scanf` is slow for large inputs. `getchar_unlocked` or a `fread`-based reader is significantly faster. `fread` into a buffer and parse by hand is the usual contest answer.

**Pascal.** `ReadLn` and `Read` are slow. Reading the whole input with `ReadLn` in a loop and splitting it into tokens is the common workaround, and it is what the reference implementations in this encyclopedia do.

**JavaScript.** `fs.readFileSync(0, "utf8")` reads the whole of standard input in one call, and splitting it with a regular expression is the usual approach.

**Output** deserves the same attention. Build one large string and write it once. In C++ use `'\n'` rather than `std::endl`, which flushes on every call. In Java accumulate into a `StringBuilder` and print once. In Python use `sys.stdout.write` with a joined string rather than `print` in a loop.

**Why it matters.** A correct solution that reads its input slowly fails the time limit. This is the most common cause of a "wrong" contest result for an algorithm that is right.

**Worked example.** The same task in each language, reduced to its essentials:

```cpp
// C++17
std::ios::sync_with_stdio(false);
std::cin.tie(nullptr);
int n; std::cin >> n;
```

```java
// Java
final FastScanner fs = new FastScanner();
final int n = fs.nextInt();
```

```python
# Python
data = sys.stdin.buffer.read().split()
n = int(data[0])
```

```c
/* C */
long long n = 0;
if (scanf("%lld", &n) != 1) return 0;
```

**What you must get right.** Turn off synchronisation, read the whole input at once where the memory allows, and write the output in one operation. Measure before you optimize further, and never let the input path be the reason you time out.

## 5.10 Language-specific stack and memory constraints

Every language has its own memory model, and the constraints differ enough that a solution that fits in one may not fit in another.

| Language | Default stack | Heap | What to watch |
| --- | --- | --- | --- |
| C and C++ | 8 MB on Linux | `malloc` | manual frees, fragmentation |
| Java | 512 KB to 1 MB per thread | managed, `-Xmx` | boxing, garbage collection pauses |
| Python | OS stack plus a recursion limit | managed | recursion limit, object overhead |
| Pascal | about 8 MB | `GetMem`, `SetLength` | fixed static arrays, no GC |
| JavaScript | engine-dependent, often about 1 MB | managed | call-stack limit, closures |

**Recursion depth.** C and C++ give you roughly $10^5$ frames before the stack overflows and the process dies with a segmentation fault. Java throws `StackOverflowError`, which is an `Error` rather than an `Exception`, so `catch (Exception e)` will not catch it. CPython hits its recursion limit of 1000 first; raising it with `sys.setrecursionlimit` raises the interpreter's counter but does not make deep recursion safe, because each Python-level call still consumes a C stack frame and a large enough limit turns a clean `RecursionError` into a crash of the whole interpreter. JavaScript throws a `RangeError` for stack exhaustion.

**Memory overhead per value.** A `std::vector<int>` of $10^6$ elements costs 4 MB. A Python list of $10^6$ small integers costs about 8 MB for the pointers plus the objects, though small integers in the range $-256$ to $256$ are interned. A Java `ArrayList<Integer>` of $10^6$ elements costs about 24 MB.

**Typical limits.** Contest time limits are on the order of two seconds and memory limits on the order of a few hundred megabytes, but the authoritative figures are always the ones printed on the problem. Check them.

**Why it matters.** A recursion that works in Java at depth $5000$ may overflow in Python, and a table that fits in C++ may not fit in Java.

**Worked example.** A recursive depth-first search on a path graph of $10^5$ vertices is fine in C++ with an explicit stack, throws `StackOverflowError` in Java, and hits the recursion limit in CPython before it throws anything. The portable version holds the stack in a `std::vector` or a Java `ArrayDeque` and iterates.

**What you must get right.** Know the recursion depth of the inputs you will face, and convert deep recursion to iteration when the depth is not bounded by a small constant. And compute your memory in the language you will actually submit, because the per-element overheads differ by an order of magnitude.

## The bits/stdc++.h warning

One C++ convention deserves an explicit warning, because it is used constantly in competitive programming and it is not standard C++.

`#include <bits/stdc++.h>` is a convenience header provided by the GNU C++ library. It includes every header in the standard library, so `std::vector`, `std::sort`, `std::queue` and everything else become available with a single line. It is not part of the C++ standard, and it does not exist in Microsoft's compiler or in a libc++-only build.

The costs are real but modest:

- **Portability.** The code stops compiling anywhere but GCC. The standards-compliant alternative is a short list of explicit includes, and this project ships both: a GCC convenience template and a standards-compliant template for every contest algorithm.
- **Compilation time.** The umbrella header is large, so every translation unit that includes it pays for parsing all of it. On a large project this is measurable; on a single contest file it is not.
- **Name collisions.** The umbrella header pulls in both the standard library and C library headers, which define names such as `index`, `div`, `y1` and `time` in the global namespace. These occasionally collide with your own names.
- **Missing includes.** A file that compiles only because of the umbrella header hides the fact that it is missing a real `#include`. When you later replace the umbrella header with the explicit list, the compiler tells you exactly which include was missing, and that is the moment the convention is teaching you to write correct code.

The judgment is simple. If your contest environment is GCC, the umbrella header is harmless and saves a line of typing. If you want code that compiles anywhere, or if you are learning C++ properly, write the explicit includes.

```cpp
// The convenience form, used throughout the competitive programming world.
#include <bits/stdc++.h>
```

```cpp
// The standards-compliant form, used by the portable templates here.
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
```

## Review checklist

You are ready for part 6 when you can answer the following without consulting the text.

- Explain why `long` is not a safe substitute for `long long` in C++, and why `1LL * a * b` is not the same as `a * b` widened afterwards.
- Give the C++17 equivalent of `HashMap`, `TreeMap`, `PriorityQueue` and `ArrayDeque`, and say when you would choose the ordered map over the hash map.
- Explain why a function taking `std::vector<int>` by value can make a loop quadratic, and give the signature you would use instead.
- State the cost of `list.pop(0)` in Python and of `list.append` in Java, and name the replacement in each case.
- Explain what boxing costs in Java and why `Arrays.sort(int[])` is faster than `Collections.sort(List<Integer>)`.
- State what `Number.MAX_SAFE_INTEGER` is, what `BigInt` is for, and what happens if you mix the two in an expression.
- Give the reason `Scanner` is unsuitable for contest input, and name the replacement.
- State the recursion depth limits of C++, Java, CPython and JavaScript, and say what `sys.setrecursionlimit` does and does not change.
- List three reasons not to use `bits/stdc++.h` outside a GCC-only environment, and write the standards-compliant include list for a program that uses vectors, sorting and fast input.

Next: [Contest problem-solving literacy](/start/from-ap-csa/part-6-contest-literacy).
