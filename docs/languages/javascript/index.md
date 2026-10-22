---
id: languages.javascript
title: The JavaScript center
summary: An educational reference for JavaScript written against Node.js, covering number precision, BigInt, typed arrays, Map and Set, hand-built heaps, the call stack limit, and the cost of the runtime.
division: []
subjects: [foundations]
level: intermediate
importance: extended-reference
keywords: [JavaScript, Node.js, BigInt, typed array, Map, Set, numeric sort, call stack]
prerequisites:
    required: []
    recommended:
        [
            start.computational-foundations,
            start.data-structures,
            start.language-transition,
            foundations.binary-representation,
        ]
reviewed: false
draft: false
---

<Synonyms terms="JavaScript, Node, Node.js, ECMAScript, CommonJS, scripting language" />

**JavaScript is an educational reference only. It is not a USACO submission language, and nothing in this center may be presented as an official submission solution.** The published USACO contest instructions list C, C++, Java and Python as the languages to which a solution may be submitted, and JavaScript is not among them.

JavaScript is here because it is a language many people meet before competitive programming, and because the same algorithm in a scripting runtime makes the abstract parts of the algorithm easier to see. The implementations in this encyclopedia that use JavaScript are marked as educational reference implementations for the same reason.

## The reference runtime

The reference runtime for this center is **Node.js 18 or later**, in CommonJS form. A program is a file of JavaScript that Node runs directly.

```bash
node program.js < input.txt
```

Node reads the file descriptor 0 as standard input, writes to descriptor 1 as standard output, and exits with status 0 on success. A program that throws an uncaught exception exits with a non-zero status, which is what a judge would see as a runtime error.

The CommonJS module system is the one to use, because it is the one that Node has always supported and the one the implementations in this encyclopedia use.

```javascript
"use strict";

const fs = require("fs");

process.stdout.write("hello\n");
```

`"use strict"` at the top of the file turns on strict mode, which makes a few silent failures into errors: assigning to an undeclared variable throws instead of creating a global, and `this` inside a plain function call is `undefined` instead of the global object.

## The standard input template

Read the whole of standard input, split it on whitespace, and convert the tokens as they are needed.

```javascript
"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO
 * submission language.
 */

const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();
const tokens = input.length === 0 ? [] : input.split(/\s+/);

function main() {
    if (tokens.length < 1) {
        return;
    }
    const n = Number(tokens[0]);
    const values = tokens.slice(1, 1 + n).map(Number);

    let total = 0;
    for (const value of values) {
        total += value;
    }

    process.stdout.write(String(total) + "\n");
}

main();
```

The three lines that matter are these.

`fs.readFileSync(0, "utf8")` reads the whole of standard input. The argument `0` is the file descriptor, which is standard input on every platform, and the second argument asks for a string rather than a `Buffer`.

`.trim()` removes the whitespace at both ends. The published USACO instructions require the last line of the input and the last line of the output to end with a newline, and the trim is what keeps a trailing newline from producing an empty final token.

`input.split(/\s+/)` is the regular-expression split that turns the remaining text into tokens. The expression matches a run of one or more whitespace characters, so a run of spaces, a tab, and a newline all separate tokens the same way, and the leading whitespace that the trim left behind is not a problem. An empty input would otherwise produce a single empty token, which is why the length is checked first.

`process.stdout.write` is used instead of `console.log` because `console.log` formats its argument, which is slow in a loop, and because `write` does not add a newline that the program may not want.

## Number precision and `Number.MAX_SAFE_INTEGER`

Every number in JavaScript is a double: a 64-bit IEEE 754 value with a 53-bit significand. Integers are therefore exact only up to $2^{53} - 1$, and that value has a name.

```javascript
"use strict";

console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log(Number.MAX_VALUE); // 1.7976931348623157e+308
console.log(Number.EPSILON); // 2.220446049250313e-16
console.log(Number.isSafeInteger(9007199254740991)); // true
console.log(Number.isSafeInteger(9007199254740992)); // false
```

The practical consequence is that a value beyond $2^{53} is rounded to the nearest representable double, and two different large integers can compare equal.

```javascript
"use strict";

const a = 9007199254740992; // 2^53
const b = 9007199254740993; // 2^53 + 1
console.log(a === b); // true: both round to the same double
```

The second consequence is that ordinary floating point is inexact, and a comparison of two floats that ought to be equal will fail.

```javascript
"use strict";

console.log(0.1 + 0.2 === 0.3); // false
console.log(0.1 + 0.2); // 0.30000000000000004
```

The rule that follows is the same one that holds in C and in Java: use integers for every exact computation, and use a tolerance only where a real-valued answer is genuinely required.

A further hazard is that JavaScript has one numeric type, so there is no distinction between a count and a measurement. The bitwise operators `&`, `|`, `^`, `<<` and `>>` convert their operands to a 32-bit signed integer first, and `<<` shifts by the low five bits of the shift count only, so `1 << 32` is `1` rather than what a C programr expects.

## `BigInt` and the restriction against mixing it with `Number`

`BigInt` is an arbitrary-precision integer. A `BigInt` literal ends in `n`, and the `BigInt` function converts a value that is already a whole number.

```javascript
"use strict";

const big = 123456789012345678901234567890n;
console.log(big * 2n);
console.log(big.toString());
```

**A `BigInt` cannot be mixed with a `Number` in an arithmetic operation.** This is not a silent conversion; it is a `TypeError`.

```javascript
"use strict";

try {
    console.log(1n + 1);
} catch (error) {
    console.log(error.constructor.name); // TypeError
}
```

The comparison operators are the exception that proves the rule: `1n === 1` is `false` rather than an error, because the operators compare a `BigInt` with a `Number` by first checking whether their mathematical values are equal, and the values are not equal. `1n == 1` is also `false`, because the strict comparison also compares the types.

Two more restrictions are worth knowing. `JSON.stringify` throws a `TypeError` when it meets a `BigInt`, so a `BigInt` has to be converted with `String(value)` before it is serialized. And a `BigInt` has no floating point conversion, so `Number(big)` loses precision for a value beyond the safe range.

The rule is therefore: pick one numeric type for a program and stay with it. A program that uses `Number` for the graph and `BigInt` for the arithmetic has to convert at every boundary, and each conversion is a place where a precision loss can hide.

## Arrays versus typed arrays

A JavaScript `Array` is a general-purpose container. It holds any value, it grows, and it is optimized by the engine in ways that depend on what it holds: an array of small integers is stored compactly, an array of doubles is stored as doubles, and an array that has had an element deleted is stored as a sparse array with holes, which is slower.

```javascript
"use strict";

const values = [3, 1, 4, 1, 5];
values.push(9);
values.pop();
console.log(values.length, values[0]);
```

A **typed array** is a view over a block of memory of a fixed width and a fixed element type. It has a fixed length, it is contiguous, and every element access is a direct load with no boxing and no type test.

| Typed array                                    | Element        | Bytes per element |
| ---------------------------------------------- | -------------- | ----------------- |
| `Int8Array`, `Uint8Array`, `Uint8ClampedArray` | Small integer  | 1                 |
| `Int16Array`, `Uint16Array`                    | Short integer  | 2                 |
| `Int32Array`, `Uint32Array`                    | Integer        | 4                 |
| `Float32Array`, `Float64Array`                 | Real number    | 4, 8              |
| `BigInt64Array`, `BigUint64Array`              | 64-bit integer | 8                 |

```javascript
"use strict";

const values = new Int32Array(4);
values[0] = 10;
values[1] = 20;
console.log(values.length, values[1], values[2]);

const copy = Int32Array.from([5, 6, 7]);
console.log(copy[0]);
```

The trade-off is exact. A typed array is faster and far smaller, and it holds one kind of number with a fixed width, so it cannot hold a string and cannot grow. Use an `Array` for a list of arbitrary values and a typed array for a large buffer of numbers.

Node adds `Buffer`, which is a `Uint8Array` with methods for reading and writing binary data, and it is the fastest way to move bytes around in Node.

The complexity of the common operations follows from the same facts. `push` and `pop` are amortised $O(1)$, because the engine grows the backing store geometrically. `shift` and `unshift` are $O(n)$, because every element has to move. `splice` is $O(n)$. A read at an index is $O(1)$ for both kinds of container.

## `Map` and `Set`

A `Map` is a hash map from any value to any value, and a `Set` is a collection of distinct values. Both preserve insertion order, both have an average $O(1)$ lookup, and both are better choices than a plain object when the keys are not strings.

```javascript
"use strict";

const counts = new Map();
counts.set("a", 1);
counts.set("b", 2);
counts.set("a", counts.get("a") + 1);

console.log(counts.size, counts.get("a"), counts.has("z"));
console.log(counts.get("z")); // undefined, not an error

for (const [key, value] of counts) {
    console.log(key, value);
}

const seen = new Set([1, 2, 2, 3]);
console.log(seen.size); // 3
```

Three differences from a plain object are worth naming. A `Map` accepts objects and arrays as keys, which an object does not, because an object key is converted to a string. A `Map` has a `size` property, while an object's key count has to be computed with `Object.keys(obj).length`. And a missing key returns `undefined` from `get` rather than throwing, which is the same as a plain object but is worth stating because the failure mode of a missing key in a `Map` is a later `undefined` rather than an exception.

A plain object is still the right choice for a fixed set of string keys, because the engine can optimize property access on a stable shape.

## Custom heaps

JavaScript has no priority queue, so a program that needs one writes it. The array-backed binary heap is the same structure as in every other language in this encyclopedia.

```javascript
"use strict";

/**
 * A binary min-heap of comparable values, backed by a flat array.
 */
class MinHeap {
    constructor() {
        this.items = [];
    }

    get size() {
        return this.items.length;
    }

    peek() {
        if (this.items.length === 0) {
            return undefined;
        }
        return this.items[0];
    }

    push(value) {
        const items = this.items;
        items.push(value);
        let index = items.length - 1;
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (items[parent] <= items[index]) {
                break;
            }
            const swap = items[parent];
            items[parent] = items[index];
            items[index] = swap;
            index = parent;
        }
    }

    pop() {
        const items = this.items;
        if (items.length === 0) {
            return undefined;
        }
        const top = items[0];
        const last = items.pop();
        if (items.length > 0) {
            items[0] = last;
            let index = 0;
            for (;;) {
                let child = 2 * index + 1;
                if (child >= items.length) {
                    break;
                }
                if (child + 1 < items.length && items[child + 1] < items[child]) {
                    child += 1;
                }
                if (items[index] <= items[child]) {
                    break;
                }
                const swap = items[index];
                items[index] = items[child];
                items[child] = swap;
                index = child;
            }
        }
        return top;
    }
}

const heap = new MinHeap();
heap.push(5);
heap.push(1);
heap.push(3);
console.log(heap.peek(), heap.pop(), heap.size);
```

A push and a pop are each $O(\log n)$, because the element moves along a single root-to-leaf path of the heap, whose length is the base-two logarithm of the size.

## Sorting numerically with a comparator

The default sort of an `Array` converts every element to a string and sorts the strings lexicographically, so the numbers come out in the wrong order.

```javascript
"use strict";

const values = [10, 9, 1, 100];
console.log(values.slice().sort()); // 1, 10, 100, 9
console.log(values.slice().sort((a, b) => a - b)); // 1, 9, 10, 100
```

A comparator for numbers is `(a, b) => a - b`. A comparator that returns a boolean, such as `(a, b) => a < b`, is wrong, because a boolean is coerced to a number and a comparison that is `false` becomes `0`, which tells the sort that every pair is equal.

The sort is stable, so two elements that compare equal keep their relative order, and a comparator that breaks the tie explicitly makes the output deterministic.

```javascript
"use strict";

const contestants = [
    { name: "ada", score: 30 },
    { name: "bob", score: 10 },
    { name: "cyd", score: 30 },
];

contestants.sort((a, b) => {
    if (a.score !== b.score) {
        return b.score - a.score;
    }
    return a.name < b.name ? -1 : 1;
});

console.log(contestants.map((c) => `${c.name} ${c.score}`).join("\n"));
```

Note that `Array.prototype.sort` sorts the array in place, and the comparator receives the values themselves and not their indices.

## Recursive stack limitations

Node runs the program on a real machine stack, and the size of that stack is finite. The default is about 984 kilobytes, which gives on the order of ten thousand frames for a simple function. Exceeding it throws a `RangeError` with the message `Maximum call stack size exceeded`, and the program stops.

**A chain-shaped graph gives recursion depth proportional to the number of vertices**, so an $O(V + E)$ recursive depth-first search over a long path overflows the stack even though its running time is linear. The time bound and the stack depth are separate resources.

The recommendation for JavaScript is: **use an explicit stack for any traversal whose depth is not provably small.** A recursion of depth $O(\log n)$, such as a divide and conquer, is safe. A recursion over a graph, is not.

The `--stack-size` command-line option raises the limit, in kilobytes, and it works, but it is a limit and not a solution: the same program can then exhaust the memory instead of the stack, and the failure moves rather than disappears.

```javascript
"use strict";

/**
 * Visits every vertex reachable from source.
 *
 * The stack replaces the call stack, so a chain of any length is
 * traversed without recursion.
 *
 * @param {number[][]} adj adjacency list; adj[v] lists the neighbors of v
 * @param {number} source the start vertex
 * @returns {number[]} the visited vertices in visit order
 */
function dfsReachable(adj, source) {
    if (source < 0 || source >= adj.length) {
        return [];
    }

    const visited = new Array(adj.length).fill(false);
    const stack = [source];
    const order = [];
    while (stack.length > 0) {
        const v = stack.pop();
        if (visited[v]) {
            // The vertex was already reached through another edge.
            continue;
        }
        visited[v] = true;
        order.push(v);
        for (const w of adj[v]) {
            if (!visited[w]) {
                stack.push(w);
            }
        }
    }
    return order;
}
```

## Node.js performance considerations

Node is fast for the same reason a compiled language is fast: the engine compiles the hot functions to machine code while the program runs. The practical consequences follow from the engine's design.

**A stable shape is a fast object.** The engine infers the shape of an object from the order in which its properties are first assigned, and it optimizes property access for objects that share a shape. Adding a property later, or assigning the properties in a different order in different places, produces objects with different shapes and a slower access path. Creating the properties in the same order everywhere is worth more than any micro-optimization.

**Deleting a property is expensive.** A `delete` leaves a hole, and the engine has to switch the object into a slower representation. Set the property to `null` or `undefined` instead.

**`Map` beats an object for dynamic keys.** An object with a thousand different key names has a thousand shapes, while a `Map` has one shape and a hash table inside it.

**Avoid `arguments` and prefer rest parameters.** A rest parameter collects into a real array; `arguments` is an array-like object with a different shape, and the engine treats it more slowly.

**Output is cheaper when it is batched.** Every `process.stdout.write` is a call into the stream machinery, so a program that prints a million lines should build one string and write it once.

**Reading the whole input is a memory decision.** `fs.readFileSync(0, "utf8")` holds the entire input in memory as a string, and the split then holds a second copy of the same information as an array of strings. For a very large input, read it in chunks.

**The event loop is single-threaded.** A synchronous read or a tight loop blocks everything else in the process. In a contest program there is nothing else to do, so this is rarely a problem, but it is why the asynchronous variants of the file and stream functions exist.

## Debugging advice

Node reports an uncaught exception with the file, the line, and the column, followed by the stack trace of the call chain. The first line is the message, and the frames below it are the call chain, so the trace is read from the bottom up in exactly the way a Java trace is.

The three failure modes that account for most wrong answers are these.

The first is a silent `NaN`. A `NaN` propagates through every arithmetic operation and through every comparison, and `NaN === NaN` is false, so a `NaN` in an array makes a sort comparator misbehave in a way that is very hard to see. `NaN` almost always comes from `Number` on a token that is not a number, or from `0 / 0`, or from subtracting `Infinity`. Test with `Number.isNaN(value)`.

The second is an off-by-one in a range. A `for` loop of the form `for (let i = 0; i <= n; i++)` runs one time too many, and `arr[i]` on the last pass is `undefined` rather than an error, so the wrong value enters the answer quietly.

The third is a mutation during iteration. Removing an element from an array with `splice` while a `for...of` loop is running over it skips the element after the removed one, because the loop's index moves on while the array has shrunk.

Two habits make the debugging faster. Use `console.error` for diagnostics and `console.log` for the answer, so the two do not get mixed. And assert the shape of the data you parsed before you compute anything with it, because a parser bug and an algorithm bug look identical from the outside.

## Template library

**A general program.**

```javascript
"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO
 * submission language.
 */

const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();
const tokens = input.length === 0 ? [] : input.split(/\s+/);

function main() {
    if (tokens.length < 1) {
        return;
    }
    const n = Number(tokens[0]);
    const values = tokens.slice(1, 1 + n).map(Number);

    values.sort((a, b) => a - b);

    const parts = [];
    for (let i = 0; i < values.length; i++) {
        parts.push(String(values[i]));
    }
    process.stdout.write(parts.join(" ") + "\n");
}

main();
```

**Graph input.**

```javascript
"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO
 * submission language.
 */

const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();
const tokens = input.length === 0 ? [] : input.split(/\s+/);

function main() {
    if (tokens.length < 2) {
        return;
    }

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    if (n <= 0) {
        process.stdout.write("0\n\n");
        return;
    }

    const adj = [];
    for (let v = 0; v < n; v += 1) {
        adj.push([]);
    }

    let index = 2;
    for (let i = 0; i < m; i += 1) {
        if (index + 1 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        index += 2;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[u].push(v);
        adj[v].push(u);
    }
    const source = index < tokens.length ? Number(tokens[index]) : -1;

    /* Solve the problem here, using adj and source. */
}

main();
```

**Weighted graph input with a min-heap of distances.**

```javascript
"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO
 * submission language.
 */

const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();
const tokens = input.length === 0 ? [] : input.split(/\s+/);

/**
 * A binary min-heap of [distance, vertex] pairs, backed by a flat array.
 */
class MinHeap {
    constructor() {
        this.items = [];
    }

    get size() {
        return this.items.length;
    }

    push(entry) {
        const items = this.items;
        items.push(entry);
        let index = items.length - 1;
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (items[parent][0] <= items[index][0]) {
                break;
            }
            const swap = items[parent];
            items[parent] = items[index];
            items[index] = swap;
            index = parent;
        }
    }

    pop() {
        const items = this.items;
        if (items.length === 0) {
            return undefined;
        }
        const top = items[0];
        const last = items.pop();
        if (items.length > 0) {
            items[0] = last;
            let index = 0;
            for (;;) {
                let child = 2 * index + 1;
                if (child >= items.length) {
                    break;
                }
                if (child + 1 < items.length && items[child + 1][0] < items[child][0]) {
                    child += 1;
                }
                if (items[index][0] <= items[child][0]) {
                    break;
                }
                const swap = items[index];
                items[index] = items[child];
                items[child] = swap;
                index = child;
            }
        }
        return top;
    }
}

function main() {
    if (tokens.length < 4) {
        return;
    }

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    const adj = [];
    for (let v = 0; v < n; v += 1) {
        adj.push([]);
    }

    let index = 2;
    for (let i = 0; i < m; i += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        const w = Number(tokens[index + 2]);
        index += 3;
        if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
            continue;
        }
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }
    const source = Number(tokens[index]);

    const distance = new Array(n).fill(Infinity);
    distance[source] = 0;
    const heap = new MinHeap();
    heap.push([0, source]);
    while (heap.size > 0) {
        const [current, u] = heap.pop();
        if (current !== distance[u]) {
            // A shorter path was found after this entry was pushed.
            continue;
        }
        for (const [v, w] of adj[u]) {
            const candidate = current + w;
            if (candidate < distance[v]) {
                distance[v] = candidate;
                heap.push([candidate, v]);
            }
        }
    }

    const parts = [];
    for (let v = 0; v < n; v += 1) {
        parts.push(String(distance[v]));
    }
    process.stdout.write(parts.join(" ") + "\n");
}

main();
```

## What to remember

JavaScript is a reference, not a submission language, and a program written in it is an educational reference implementation.

The three things worth taking away are these. A number is a double, so every exact computation needs `Number.isSafeInteger` to be within range, and `BigInt` is the only way past that range and cannot be mixed with `Number`. A typed array is the right container for a large buffer of numbers, and a `Map` is the right container for dynamic keys. And the call stack is finite, so a traversal over a graph needs an explicit stack.
