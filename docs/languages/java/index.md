---
id: languages.java
title: The Java center
summary: Three input strategies from Scanner to a custom buffered parser, the cost of boxing, primitive arrays, and the submission conventions that the USACO judge enforces.
division: []
subjects: [foundations]
level: intermediate
importance: core-prerequisite
keywords: [Java, FastScanner, BufferedReader, StringTokenizer, StringBuilder, boxing, Main]
prerequisites:
    required: []
    recommended:
        [
            start.computational-foundations,
            start.data-structures,
            start.language-transition,
            foundations.complexity,
        ]
reviewed: false
draft: false
---

<Synonyms terms="Java, HotSpot, OpenJDK, Java 17, fast input, buffered input" />

Java is one of the four languages USACO accepts for submission, and it is the one of the four that the compiler guards most strictly. Every object has a known lifetime, an out-of-bounds array access is an exception rather than a silent corruption, and a null reference is reported at the line that dereferenced it. In exchange, a Java program carries a startup cost and runs more slowly than an equivalent C++ program, and the standard library wraps every primitive in an object unless you avoid it.

This center describes the language as it must be written to pass the judge.

## Submission conventions

The published USACO instructions are explicit about the shape of a Java submission, and every one of these rules is checked by the judge before the program runs.

The whole program goes in one file. The file holds exactly one `public` class, and that class has the same name as the file. Every other class in the file is declared without the `public` keyword. The public class contains a `public static void main` method, and the file contains no `package` declaration.

The house convention is to name the file and the public class `Main`, so the submission is `Main.java` holding `public class Main`. The implementations in this encyclopedia follow it exactly.

```java
public final class Main {

    private Main() {
    }

    public static void main(String[] args) {
        System.out.println("hello");
    }
}
```

A second class in the same file is declared without `public`.

```java
public final class Main {

    private Main() {
    }

    public static void main(String[] args) {
        System.out.println(new Counter().count(3));
    }
}

final class Counter {
    int count(int n) {
        int total = 0;
        for (int i = 0; i < n; i++) {
            total += i;
        }
        return total;
    }
}
```

The published instructions also state the runtime. USACO compiles and executes Java with the OpenJDK Runtime Environment, version 11.0.10, and the A.A.Y.N.T.N. implementations in this repository target Java 17. The code in this center is written to compile and run on both, so it uses no feature newer than Java 11: no `var`, no records, no switch expressions, no text blocks, and no pattern-matching `instanceof`.

The time limit is the other published detail. A USACO contest gives roughly four seconds per test case to a Java submission against two seconds for a C or C++ submission, with the caveat that each contest or problem may use slightly different limits.

## The three input strategies

### `Scanner`, for small input, learning, and debugging

`java.util.Scanner` is the easiest of the three to write and the slowest to run.

```java
import java.util.Scanner;

public final class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += in.nextLong();
        }
        System.out.println(total);
    }
}
```

The slowness is not a matter of style. A `Scanner` reads a token at a time from a stream that it synchronizes on every access, and it parses each token with a regular expression, so the constant factor per token is one or two orders of magnitude above a hand-written byte parser. On an input of a million tokens, a `Scanner` can be the difference between finishing and timing out.

Use it when the input has a few hundred tokens, when you are learning the language, or when you are debugging and would rather read `in.nextInt()` than decode a byte. Do not use it in a solution you intend to submit.

### `BufferedReader` with `StringTokenizer`, the general baseline

`BufferedReader` reads a line at a time into a character buffer, and `StringTokenizer` splits that line into tokens without allocating a `String` for each one. The published USACO instructions recommend exactly this over `Scanner`.

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public final class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in =
                new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer first = new StringTokenizer(in.readLine());
        int n = Integer.parseInt(first.nextToken());
        long total = 0;
        for (int i = 0; i < n; i++) {
            StringTokenizer row = new StringTokenizer(in.readLine());
            total += Long.parseLong(row.nextToken());
        }
        System.out.println(total);
    }
}
```

The strength of this approach is that it is short, readable, and fast enough for almost every contest input. The weakness is that it assumes the input is laid out in lines, and a contest input is not always laid out the way a human would expect. A value that wraps across a line break breaks the program, and the failure appears in the middle of a long computation.

### A custom buffered byte parser, for very large input

When the input is large, read it as bytes and decode the numbers yourself. This is the third strategy, and it is the one to use for a serious contest submission. The class below is a complete file, saved as `FastScanner.java`.

```java
import java.io.IOException;
import java.io.InputStream;

/**
 * Token scanner over standard input.
 *
 * The buffer holds 64 KB of raw bytes, so a read of the operating system
 * is amortised over thousands of tokens.
 */
final class FastScanner {
    private final InputStream in = System.in;
    private final byte[] buffer = new byte[1 << 16];
    private int pointer = 0;
    private int available = 0;

    private int readByte() throws IOException {
        if (pointer >= available) {
            available = in.read(buffer);
            pointer = 0;
            if (available <= 0) {
                // Keep the buffer empty, so the next call reads again and
                // reports the end of the input again.
                available = 0;
                return -1;
            }
        }
        return buffer[pointer++];
    }

    /**
     * The next token as a number.
     *
     * The end of the input is reported by the sentinel Long.MIN_VALUE, so
     * a program must not read a value that is legitimately
     * Long.MIN_VALUE.
     *
     * @return the value of the next token, or Long.MIN_VALUE at the end of
     *         the input
     * @throws IllegalArgumentException when the token is not an integer, or
     *         when its value does not fit in a long
     * @throws IOException when standard input cannot be read
     */
    long nextLong() throws IOException {
        int c = readByte();
        while (c != -1 && c <= ' ') {
            c = readByte();
        }
        if (c == -1) {
            // The end of the input: the caller sees the sentinel.
            return Long.MIN_VALUE;
        }
        boolean negative = false;
        if (c == '-') {
            negative = true;
            c = readByte();
        }
        long value = 0;
        while (c > ' ') {
            if (c < '0' || c > '9') {
                // A token that is not an integer is a malformed input, and
                // it is reported rather than silently decoded as a number.
                throw new IllegalArgumentException(
                        "malformed token: expected an integer");
            }
            final int digit = c - '0';
            if (value > (Long.MAX_VALUE - digit) / 10) {
                throw new IllegalArgumentException(
                        "malformed token: the value does not fit in a long");
            }
            value = value * 10 + digit;
            c = readByte();
        }
        return negative ? -value : value;
    }
}
```

Two decisions in that class are worth stating out loud.

The first is the **explicit malformed-input behavior**. A token that contains a character which is not a digit raises an `IllegalArgumentException` with a message that names the problem, instead of being decoded into a plausible-looking wrong number. The same applies to a value whose magnitude exceeds the range of a `long`, which is caught before the multiplication overflows. A parser that guesses is a parser that produces a wrong answer three hours into a contest.

The second is the **end-of-input sentinel**. `Long.MIN_VALUE` is returned when the input holds no more tokens, which lets the caller test for the end of the input without an extra method. The cost is that a legitimate `Long.MIN_VALUE` in the input would be mistaken for the end, so a program that reads that value must not use this scanner as it stands. The alternative is to add a `hasNext()` method that peeks at the next non-space byte, which removes the restriction at the price of a few more lines.

The rest of the class is the standard buffer discipline. `pointer` is the index of the next byte to read and `available` is the number of valid bytes in the buffer. When the two meet, another read fills the buffer. The `read` returns `-1` at the end of the input, and the code converts that into an empty buffer so that the next call tries again and reports the end again, rather than reading past the end of the array.

## Output: `StringBuilder` and `BufferedWriter`

`System.out.println` is a synchronized call on a `PrintStream` that flushes on every call, and each call is a write to the output stream. Printing a million numbers one at a time therefore costs a million writes.

The fix is to build the output in memory and write it once.

```java
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;

public final class Main {
    public static void main(String[] args) throws IOException {
        StringBuilder output = new StringBuilder();
        for (int i = 0; i < 100000; i++) {
            output.append(i).append(' ');
        }
        output.append('\n');
        System.out.print(output);

        BufferedWriter writer =
                new BufferedWriter(new OutputStreamWriter(System.out));
        writer.write("done\n");
        writer.flush();
    }
}
```

`StringBuilder` is the right class for this and `StringBuffer` is the wrong one. `StringBuffer` synchronizes every method, and a program that builds its output in a single thread pays for synchronisation it does not need.

A `BufferedWriter` is the alternative when the output is too large to hold in memory, or when it is written incrementally. It must be flushed before the program ends, or the last part of the output is lost.

## Primitive arrays and the cost of boxing

A `int` in an `int[]` occupies four bytes and nothing else. An `Integer` in an `Integer[]` is a heap object with a header and a value field, which is sixteen bytes on a 64-bit JVM with compressed object pointers, and it is a separate allocation for every element.

```java
import java.util.ArrayList;
import java.util.List;

public final class Main {
    public static void main(String[] args) {
        int[] primitive = new int[1000000];
        Integer[] boxed = new Integer[1000000];
        List<Integer> list = new ArrayList<>();

        for (int i = 0; i < 1000000; i++) {
            primitive[i] = i;
            boxed[i] = i;
            list.add(i);
        }
        System.out.println(primitive.length + " " + boxed.length + " " + list.size());
    }
}
```

`List<Integer>` is worse than `Integer[]`, because the `ArrayList` holds an `Object[]` internally and every element is a separate sixteen-byte object. The three arrays above hold the same million values, and the memory they take is on the order of four megabytes, sixteen megabytes, and twenty megabytes.

The values from -128 to 127 are a special case. The JVM caches the `Integer` objects for that range, so boxing a small value does not allocate, and `Integer.valueOf(5) == Integer.valueOf(5)` is true. Outside that range, every boxing allocates a new object, and `Integer.valueOf(1000) == Integer.valueOf(1000)` is false.

The practical rules for a contest are these. Use `int[]`, `long[]`, and `double[]` for the large arrays, and reserve `ArrayList<Integer>` for the cases where the size is not known in advance. Avoid putting a primitive into a collection in an inner loop, because each insertion allocates. And compare a `long` with a `long`, because comparing a `long` with an `int` widens the `int` to a `long` and there is no cost, while comparing an `Integer` with an `int` unboxes the `Integer`, and a null `Integer` throws.

## Recursion in Java

Java has no undefined behavior, and the stack overflow is reported as a `StackOverflowError` rather than as a crash. The error names the method that overflowed, which makes it a diagnosable failure, but it is still a failure and the program still scores zero.

The limit is a memory budget. The default thread stack on a 64-bit HotSpot virtual machine is about one megabyte, and a frame of a few dozen bytes gives a few thousand to a few tens of thousands of levels of recursion, depending on the method.

**A chain-shaped graph gives recursion depth proportional to the number of vertices**, so an $O(V + E)$ recursive depth-first search over a path on $10^5$ vertices overflows the stack even though its time bound is linear. The time bound and the stack depth are separate resources, and the published memory limit of about 256 MB is separate from both.

The recommendation for Java is: **use recursion when the depth is provably small, and an explicit stack otherwise.** The recursive form is fine for divide and conquer of depth $O(\log n)$, for a traversal of a tree of bounded depth, and for a backtracking search whose depth is bounded by the size of the structure being searched. It is not fine for any traversal of an arbitrary graph, whose depth can be the number of vertices.

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/* An explicit stack replaces the call stack, so a chain of any length is
   traversed without recursion. */
List<Integer> dfsIterative(List<List<Integer>> adj, int source) {
    List<Integer> order = new ArrayList<>();
    if (adj.isEmpty() || source < 0 || source >= adj.size()) {
        return order;
    }
    boolean[] visited = new boolean[adj.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(source);
    while (!stack.isEmpty()) {
        final int v = stack.pop();
        if (visited[v]) {
            // The vertex was already reached through another edge.
            continue;
        }
        visited[v] = true;
        order.add(v);
        for (final int w : adj.get(v)) {
            if (!visited[w]) {
                stack.push(w);
            }
        }
    }
    return order;
}
```

## Debugging advice

Java reports the line of the exception in a stack trace, so the first thing to do when a program throws is to read the trace from the bottom up. The bottom frame is where the failure happened, and the frames above it are the call chain that led there. A `NullPointerException` in the sixth frame is a null that arrived there six calls ago.

Three failure modes account for most Java contest bugs.

The first is an `ArrayIndexOutOfBoundsException`, which is a good failure: it names the array and the index. It usually means an off-by-one, and the fix is to look at the loop bound.

The second is a `NumberFormatException` from `Integer.parseInt`, which means the input is not shaped the way the program assumed. Parse the input once, print it, and compare it with the problem statement before looking at the algorithm.

The third is a silent wrong answer, and it is nearly always a boxing mistake or an integer overflow. A `long` computation that overflows wraps around silently in Java, because the wraparound is defined behavior, unlike in C and C++. If an answer looks like a random signed number, look for a multiplication before the cast to `long`.

## Template library

**A general program with the buffered scanner.** The default for a submission.

```java
import java.io.IOException;

public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();

        final long nToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || nToken < 0) {
            return;
        }
        final int n = (int) nToken;

        final long[] values = new long[n];
        for (int i = 0; i < n; i++) {
            values[i] = fs.nextLong();
        }

        long total = 0;
        for (final long value : values) {
            total += value;
        }

        final StringBuilder output = new StringBuilder();
        output.append(total).append('\n');
        System.out.print(output);
    }

    /**
     * Token scanner over standard input: contest inputs are far too large
     * for java.util.Scanner.
     */
    private static final class FastScanner {
        private final java.io.InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    // Keep the buffer empty, so the next call reads again and
                    // reports the end of the input again.
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        /**
         * The next token as a number.
         *
         * @return the value of the next token, or Long.MIN_VALUE at the end
         *         of the input
         * @throws IllegalArgumentException when the token is not an integer,
         *         or when its value does not fit in a long
         */
        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                // The end of the input: the caller sees the sentinel.
                return Long.MIN_VALUE;
            }
            boolean negative = false;
            if (c == '-') {
                negative = true;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                if (c < '0' || c > '9') {
                    // A token that is not an integer is a malformed input,
                    // and it is reported rather than silently decoded.
                    throw new IllegalArgumentException(
                            "malformed token: expected an integer");
                }
                final int digit = c - '0';
                if (value > (Long.MAX_VALUE - digit) / 10) {
                    throw new IllegalArgumentException(
                            "malformed token: the value does not fit in a long");
                }
                value = value * 10 + digit;
                c = readByte();
            }
            return negative ? -value : value;
        }
    }
}
```

**Graph input with the buffered scanner.**

```java
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();

        final long nToken = fs.nextLong();
        final long mToken = fs.nextLong();
        if (nToken == Long.MIN_VALUE || mToken == Long.MIN_VALUE) {
            return;
        }
        final int n = (int) nToken;
        final int m = (int) mToken;
        if (n <= 0) {
            System.out.print("\n");
            return;
        }

        final List<List<Integer>> adj = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }
        for (int i = 0; i < m; i++) {
            final int u = (int) fs.nextLong();
            final int v = (int) fs.nextLong();
            if (u < 0 || u >= n || v < 0 || v >= n) {
                continue;
            }
            adj.get(u).add(v);
            adj.get(v).add(u);
        }
        final long sourceToken = fs.nextLong();
        final int source = sourceToken == Long.MIN_VALUE ? -1 : (int) sourceToken;

        /* Solve the problem here, using adj and source. */
    }

    private static final class FastScanner {
        private final java.io.InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer >= available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    available = 0;
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            if (c == -1) {
                return Long.MIN_VALUE;
            }
            boolean negative = false;
            if (c == '-') {
                negative = true;
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                if (c < '0' || c > '9') {
                    throw new IllegalArgumentException(
                            "malformed token: expected an integer");
                }
                final int digit = c - '0';
                if (value > (Long.MAX_VALUE - digit) / 10) {
                    throw new IllegalArgumentException(
                            "malformed token: the value does not fit in a long");
                }
                value = value * 10 + digit;
                c = readByte();
            }
            return negative ? -value : value;
        }
    }
}
```

**A general program with `BufferedReader`,** for when the input is line-shaped and small enough that the extra machinery is not worth it.

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public final class Main {

    private Main() {
    }

    public static void main(String[] args) throws IOException {
        final BufferedReader in =
                new BufferedReader(new InputStreamReader(System.in));

        final StringTokenizer header = new StringTokenizer(in.readLine());
        final int n = Integer.parseInt(header.nextToken());

        final long[] values = new long[n];
        for (int i = 0; i < n; i++) {
            final StringTokenizer row = new StringTokenizer(in.readLine());
            values[i] = Long.parseLong(row.nextToken());
        }

        final StringBuilder output = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                output.append(' ');
            }
            output.append(values[i]);
        }
        output.append('\n');
        System.out.print(output);
    }
}
```

## What to remember

Java is a good first submission language, because the compiler and the runtime both report mistakes that C and C++ leave to run time, and the time limit is generous.

The three habits that pay for themselves are these. Use the buffered byte scanner, not `Scanner`, whenever the input has more than a few hundred tokens. Use `int[]` rather than `ArrayList<Integer>` for the large arrays. And bound the depth of your recursion separately from the time it takes, because a linear algorithm can still crash on a linear input.
