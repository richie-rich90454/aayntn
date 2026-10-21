---
id: languages.c
title: The C center
summary: The C standard library, fixed and dynamic arrays, structs, pointer arithmetic, explicit bounds checking, hand-built containers, and the sanitizers that guard every allocation.
division: []
subjects: [foundations]
level: intermediate
importance: core-prerequisite
keywords: [C, stdio.h, stdlib.h, stdint.h, qsort, memory management, sanitizers, pointer arithmetic]
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

<Synonyms terms="ANSI C, C11, C programming, manual memory management, C standard library" />

C is the language in this encyclopedia with the smallest gap between what you write and what the machine executes. There is no garbage collector, no container library, and no operator overloading. In exchange, every byte of memory that your program uses is a byte you asked for, and every byte you asked for is a byte you have to release.

C is a USACO submission language. It is also the language in which the structure of a data structure is most visible, which is why it is worth learning even if you will submit in C++.

## The headers you will actually use

C has a small standard library, and a contest program needs very little of it.

| Header       | What it provides                                                         |
| ------------ | ------------------------------------------------------------------------ |
| `stdio.h`    | `scanf`, `printf`, `puts`, `putchar`, `fgets`, and the `FILE` types      |
| `stdlib.h`   | `malloc`, `calloc`, `realloc`, `free`, `qsort`, `bsearch`, `abs`, `exit` |
| `string.h`   | `strlen`, `strcmp`, `strcpy`, `memcpy`, `memset`                         |
| `stdint.h`   | The fixed-width integer types `int8_t` through `uint64_t`                |
| `inttypes.h` | `PRId64` and friends, the format macros for those types                  |
| `limits.h`   | `INT_MAX`, `INT_MIN`, `CHAR_BIT`, `LONG_MAX`                             |
| `stdbool.h`  | `bool`, `true`, `false` in C99 and later                                 |
| `assert.h`   | `assert`, which disappears when `NDEBUG` is defined                      |

`stdio.h` and `stdlib.h` are the two you cannot write a contest program without. Everything else is a specialization.

## Fixed-size arrays

A fixed-size array is a block of contiguous memory whose length is part of its type. It is allocated when the enclosing block is entered, and it is freed automatically when that block ends.

```c
#include <stdio.h>

int main(void) {
    int values[5] = {1, 2, 3, 4, 5};
    const int n = (int)(sizeof values / sizeof values[0]);

    for (int i = 0; i < n; i++) {
        printf("%d%c", values[i], (i + 1 == n) ? '\n' : ' ');
    }
    return 0;
}
```

The idiom `sizeof values / sizeof values[0]` computes the length of an array at compile time. It is correct for every real array and it is undefined for a pointer, because `sizeof` on a pointer gives the size of the pointer and not the size of what it points at.

Fixed arrays have one great property and one great cost. The property is that indexing is a single add and a single load, with no bounds check unless you ask for one. The cost is that the length must be known when the program is compiled, which is rarely true of a contest problem.

## Dynamically allocated arrays

A dynamic array is a pointer, a length, and a capacity, kept together in a struct so that they travel together.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *items;
    int size;
    int capacity;
} int_array;

/* Cleanup path: free(array->items) once, and set the pointer to NULL. */
static void int_array_free(int_array *array) {
    free(array->items);
    array->items = NULL;
    array->size = 0;
    array->capacity = 0;
}

/* Returns 0 when the array could not be grown, in which case the array is
   unchanged and still safe to use. */
static int int_array_push(int_array *array, int value) {
    if (array->size == array->capacity) {
        const int capacity = array->capacity == 0 ? 8 : 2 * array->capacity;
        int *items = realloc(array->items, (size_t)capacity * sizeof *items);
        if (items == NULL) {
            return 0;
        }
        array->items = items;
        array->capacity = capacity;
    }
    array->items[array->size++] = value;
    return 1;
}

int main(void) {
    int_array array = {NULL, 0, 0};
    for (int i = 0; i < 10; i++) {
        if (!int_array_push(&array, i * i)) {
            int_array_free(&array);
            return 0;
        }
    }
    for (int i = 0; i < array.size; i++) {
        printf("%d%c", array.items[i], (i + 1 == array.size) ? '\n' : ' ');
    }
    int_array_free(&array);
    return 0;
}
```

`realloc` is the right tool because it may extend the existing block in place, and it returns a new pointer that must replace the old one. The idiom above assigns to a temporary first, so that a failed `realloc` leaves the original block intact and owned.

The doubling policy in `int_array_push` is what makes the sequence of pushes amortised $O(1)$: the $k$-th push copies at most $k$ elements, and the copies happen logarithmically often, so the total work is $O(n)$.

## Structs

A struct groups related values so that they can be passed around as one object. In C, a struct is a layout, not a behavior: it has no methods, no constructors, and no access control.

```c
#include <stdio.h>

typedef struct {
    int vertex;
    long long weight;
} weighted_edge;

int main(void) {
    const weighted_edge edge = {3, 17};
    printf("%d %lld\n", edge.vertex, edge.weight);
    return 0;
}
```

A pointer to a struct is written `weighted_edge *`, and the arrow operator dereferences and selects in one step: `edge->weight` is `(*edge).weight`.

Two rules matter in contests. First, a struct is copied when it is assigned, so passing a large struct by value copies it; pass a pointer instead. Second, the order of the members determines the padding the compiler inserts, so putting the widest member first wastes less space.

## Pointer arithmetic

C pointers are arithmetic. The expression `p + 1` does not mean "the next byte"; it means "the next element of the array that `p` points at", and the compiler multiplies by `sizeof *p` to get the byte offset.

```c
#include <stdio.h>

int main(void) {
    int values[4] = {10, 20, 30, 40};
    int *p = values;

    printf("%d %d\n", *p, *(p + 2));
    p += 3;
    printf("%d\n", *p);
    printf("%ld\n", (long)(p - values));
    return 0;
}
```

The subtraction `p - values` yields the number of elements between the two pointers, not the number of bytes. Pointer arithmetic outside the bounds of the underlying array is undefined behavior, and the compiler is entitled to assume it does not happen, which is why an out-of-bounds pointer comparison can make an entire loop disappear.

## Explicit bounds checking

C does not check array indices. A read past the end of an array is undefined behavior, and the program may print a wrong answer, crash, or appear to work. This is the single most important thing to internalise about C.

The defensive pattern is to check the index yourself, at the point where the index enters the program.

```c
#include <stdio.h>

/* Returns the element at index, or fallback when the index is out of range.
   The bounds check happens here, once, so every caller is safe. */
static int at_or(const int *values, int size, int index, int fallback) {
    if (index < 0 || index >= size) {
        return fallback;
    }
    return values[index];
}

int main(void) {
    const int values[3] = {7, 8, 9};
    printf("%d %d\n", at_or(values, 3, 1, -1), at_or(values, 3, 5, -1));
    return 0;
}
```

For a contest, the cheapest habit is to keep the size in a variable next to the data, and to check `0 <= i && i < size` before every access. The AddressSanitizer described below finds the cases you forget, but only in the tests you actually run.

## The integer types from `stdint.h`

The C standard guarantees only that `int` is at least 16 bits and that `char` is at least 8 bits. On every platform a contest runs on, `int` is 32 bits, and the published USACO instructions say so directly: ints are 32 bits in size, and a `long long` is needed for a 64-bit integer.

`stdint.h` gives the exact types, so that the meaning of a number does not depend on the platform.

| Type                  | Bits          | Typical use                                  |
| --------------------- | ------------- | -------------------------------------------- |
| `int8_t`, `uint8_t`   | 8             | A byte of packed data, a signed difference   |
| `int16_t`, `uint16_t` | 16            | A signed difference that fits in a short     |
| `int32_t`, `uint32_t` | 32            | A vertex index, a weight, a count            |
| `int64_t`, `uint64_t` | 64            | A distance, a product, a count of paths      |
| `size_t`              | pointer-sized | A length in bytes, or an index into an array |

The published USACO instructions also note that a `long long` must be printed with the `%lld` format string when it is written with C-style output. The `inttypes.h` header gives the macro `PRId64`, which expands to the right format string for `int64_t` on any conforming implementation, and that is the safer choice in portable code.

Two arithmetic facts matter in contests. First, `int` arithmetic that overflows is undefined behavior, and the sanitizers catch it. Second, the usual arithmetic conversions promote both operands of an expression to a common type, so `int / 2` and `int * 1.0` do different things: integer division truncates toward zero, and any operation with a `double` operand produces a `double`.

## Sorting with `qsort`

`qsort` is in `stdlib.h`. It is a comparison sort with $O(n \log n)$ time in the worst case and it is not stable.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    int score;
} contestant;

/* qsort passes the address of each element, so the comparator receives a
   pointer to the element type and not to a pointer to it. */
static int compare_by_score(const void *left, const void *right) {
    const contestant *a = left;
    const contestant *b = right;
    if (a->score != b->score) {
        return (a->score < b->score) ? -1 : 1;
    }
    return strcmp(a->name, b->name);
}

int main(void) {
    contestant field[3];
    strcpy(field[0].name, "ada");
    field[0].score = 30;
    strcpy(field[1].name, "bob");
    field[1].score = 10;
    strcpy(field[2].name, "cyd");
    field[2].score = 20;

    qsort(field, 3, sizeof field[0], compare_by_score);

    for (int i = 0; i < 3; i++) {
        printf("%s %d\n", field[i].name, field[i].score);
    }
    return 0;
}
```

The comparator must return a negative number, zero, or a positive number when its first argument sorts before, with, or after its second. It must never return the difference of the two values directly, because that difference can overflow.

`qsort` is not stable, so two elements that compare equal may appear in either order. When the order of equal elements matters, sort an index array with a comparator that breaks the tie, or write your own merge sort.

## Building a stack by hand

A stack needs a backing buffer, a size, and a capacity. The implementation is the same dynamic array as above, with the two ends renamed.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *items;
    int size;
    int capacity;
} int_stack;

/* Cleanup path: free(stack->items) once. */
static void int_stack_free(int_stack *stack) {
    free(stack->items);
    stack->items = NULL;
    stack->size = 0;
    stack->capacity = 0;
}

static int int_stack_push(int_stack *stack, int value) {
    if (stack->size == stack->capacity) {
        const int capacity = stack->capacity == 0 ? 8 : 2 * stack->capacity;
        int *items = realloc(stack->items, (size_t)capacity * sizeof *items);
        if (items == NULL) {
            return 0;
        }
        stack->items = items;
        stack->capacity = capacity;
    }
    stack->items[stack->size++] = value;
    return 1;
}

static int int_stack_pop(int_stack *stack, int *value) {
    if (stack->size == 0) {
        return 0;
    }
    *value = stack->items[--stack->size];
    return 1;
}

int main(void) {
    int_stack stack = {NULL, 0, 0};
    for (int i = 1; i <= 5; i++) {
        if (!int_stack_push(&stack, i)) {
            int_stack_free(&stack);
            return 0;
        }
    }
    int value = 0;
    while (int_stack_pop(&stack, &value)) {
        printf("%d\n", value);
    }
    int_stack_free(&stack);
    return 0;
}
```

## Building a heap by hand

A binary min-heap is an array in which every node at index $i$ has its children at $2i + 1$ and $2i + 2$. The array is the whole data structure, and the only thing the heap guarantees is that the smallest element is at index zero.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long key;
    int value;
} heap_entry;

typedef struct {
    heap_entry *entries;
    int size;
    int capacity;
} min_heap;

/* Cleanup path: free(heap->entries) once. */
static void min_heap_free(min_heap *heap) {
    free(heap->entries);
    heap->entries = NULL;
    heap->size = 0;
    heap->capacity = 0;
}

/* Moves the entry at index up until its parent is not larger. */
static void heap_sift_up(min_heap *heap, int index) {
    while (index > 0) {
        const int parent = (index - 1) / 2;
        if (heap->entries[parent].key <= heap->entries[index].key) {
            break;
        }
        const heap_entry swap = heap->entries[parent];
        heap->entries[parent] = heap->entries[index];
        heap->entries[index] = swap;
        index = parent;
    }
}

/* Moves the entry at index down until neither of its children is smaller. */
static void heap_sift_down(min_heap *heap, int index) {
    for (;;) {
        int child = 2 * index + 1;
        if (child >= heap->size) {
            break;
        }
        if (child + 1 < heap->size &&
            heap->entries[child + 1].key < heap->entries[child].key) {
            child++;
        }
        if (heap->entries[index].key <= heap->entries[child].key) {
            break;
        }
        const heap_entry swap = heap->entries[index];
        heap->entries[index] = heap->entries[child];
        heap->entries[child] = swap;
        index = child;
    }
}

static int min_heap_push(min_heap *heap, long long key, int value) {
    if (heap->size == heap->capacity) {
        const int capacity = heap->capacity == 0 ? 8 : 2 * heap->capacity;
        heap_entry *entries =
            realloc(heap->entries, (size_t)capacity * sizeof *entries);
        if (entries == NULL) {
            return 0;
        }
        heap->entries = entries;
        heap->capacity = capacity;
    }
    heap->entries[heap->size].key = key;
    heap->entries[heap->size].value = value;
    heap->size++;
    heap_sift_up(heap, heap->size - 1);
    return 1;
}

static int min_heap_pop(min_heap *heap, heap_entry *entry) {
    if (heap->size == 0) {
        return 0;
    }
    *entry = heap->entries[0];
    heap->size--;
    if (heap->size > 0) {
        heap->entries[0] = heap->entries[heap->size];
        heap_sift_down(heap, 0);
    }
    return 1;
}

int main(void) {
    min_heap heap = {NULL, 0, 0};
    const long long keys[5] = {40, 10, 30, 20, 50};
    for (int i = 0; i < 5; i++) {
        if (!min_heap_push(&heap, keys[i], i)) {
            min_heap_free(&heap);
            return 0;
        }
    }
    heap_entry entry;
    while (min_heap_pop(&heap, &entry)) {
        printf("%lld\n", entry.key);
    }
    min_heap_free(&heap);
    return 0;
}
```

A push and a pop are each $O(\log n)$ because the entry moves along a single root-to-leaf path, whose length is the base-two logarithm of the size.

## Building an adjacency list by hand

The cheapest adjacency list in C is an array of arrays, one per vertex, each allocated to exactly the degree of that vertex. Reading the edges twice, once to count the degrees and once to fill the lists, avoids the repeated `realloc` that a naive append would need.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *neighbours;
    int degree;
} adjacency_list;

/* Cleanup path: free(adj[v].neighbours) for every v, then free(adj). */
static void adjacency_list_free(adjacency_list *adj, int n) {
    for (int v = 0; v < n; v++) {
        free(adj[v].neighbours);
    }
    free(adj);
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2 || n <= 0) {
        return 0;
    }

    int *edge_u = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_u);
    int *edge_v = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_v);
    int *degree = calloc((size_t)n, sizeof *degree);
    if (edge_u == NULL || edge_v == NULL || degree == NULL) {
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edge_u[kept] = u;
        edge_v[kept] = v;
        kept++;
        degree[u]++;
        degree[v]++;
    }

    adjacency_list *adj = calloc((size_t)n, sizeof *adj);
    int *cursor = calloc((size_t)n, sizeof *cursor);
    if (adj == NULL || cursor == NULL) {
        adjacency_list_free(adj, n);
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        adj[v].degree = degree[v];
        if (degree[v] > 0) {
            adj[v].neighbours = malloc((size_t)degree[v] * sizeof(int));
            if (adj[v].neighbours == NULL) {
                adjacency_list_free(adj, n);
                free(edge_u);
                free(edge_v);
                free(degree);
                return 0;
            }
        }
    }
    for (int i = 0; i < kept; i++) {
        const int u = edge_u[i];
        const int v = edge_v[i];
        adj[u].neighbours[cursor[u]++] = v;
        adj[v].neighbours[cursor[v]++] = u;
    }

    for (int v = 0; v < n; v++) {
        printf("%d:", v);
        for (int i = 0; i < adj[v].degree; i++) {
            printf(" %d", adj[v].neighbours[i]);
        }
        putchar('\n');
    }

    adjacency_list_free(adj, n);
    free(edge_u);
    free(edge_v);
    free(degree);
    free(cursor);
    return 0;
}
```

## The cleanup strategy for every allocation

C has no automatic release, so every allocation in a contest program needs a matching release, and a documented place where that release happens. The table below is the strategy used by the C implementations in this encyclopedia.

| Allocation | Owner | Release point | Failure path |
| --- | --- | --- | --- |
| `malloc` for a fixed-length array | The function that allocates it | Immediately before the function returns, on every path | If the allocation fails, free everything already allocated and return |
| `realloc` inside a growing array | The array struct | `free` on the array, once, at the end | A failed `realloc` leaves the old block owned and unchanged |
| `calloc` for a zero-initialized array | The function that allocates it | Immediately before the function returns | Same as above |
| One `malloc` per vertex in an adjacency list | The adjacency list | One `free` per vertex, then one `free` of the array of lists | A partial build must be released the same way as a complete one |
| A heap's backing array | The heap struct | One `free` when the heap is discarded | Same as above |

Two rules follow from the table. Every function that allocates should either release everything it allocated before it returns, or hand ownership to the caller explicitly, and it should say which it does. And a partially built structure must be released exactly like a complete one, because the error path is the path you did not plan.

## The sanitizers used in CI

The C implementations in this repository are compiled in CI with the C11 standard and with the flags `-Wall -Wextra -Werror -fsanitize=address,undefined`.

The two sanitizers answer two different questions.

**AddressSanitizer** instruments every memory access. It reports a heap buffer overflow, a stack buffer overflow, a use after free, a double free, and a leak at exit. It changes the layout of your program's memory, so a program that passes under the sanitizer can still fail without it, but in practice the sanitizer finds the bug that the plain run hides.

**UndefinedBehaviorSanitizer** reports the operations whose result the C standard leaves undefined: signed integer overflow, a shift by a negative number or by more than the width of the type, a division by zero, a null pointer dereference, and an array index that the compiler can see is out of range.

Together with `-Wall -Wextra -Werror`, this means that an unused variable, a missing return value, or a signed comparison of a signed and an unsigned value is a build failure rather than a warning. The C center in this encyclopedia treats that as the minimum, not the goal.

The most valuable single habit the sanitizers teach is to check every allocation. A program that checks the result of `malloc` and `realloc` cannot crash on an out-of-memory condition in a way that loses the answer you already computed.

## Recursion in C

A recursive call in C pushes a frame onto the thread stack. The stack is a fixed region of memory, commonly 8 MB on a Linux judge, and the number of frames that fit in it depends on how large each frame is.

A frame for a function with a handful of `int` parameters and a couple of local variables is a few dozen bytes, so an ordinary recursion can go several hundred thousand levels deep. A frame that holds a large local array, or that is entered from a function with many locals, is much larger.

The bound that matters is this: **a chain-shaped graph gives recursion depth proportional to the number of vertices**, so an $O(V + E)$ recursive depth-first search over a path on $10^5$ vertices will overflow the stack even though its time bound is linear. The time bound and the stack depth are independent resources, and a program must bound both.

Tail recursion is not a fix. The C standard does not require a compiler to reuse the frame of a tail call, and while GCC performs sibling-call optimization in some situations, it does not do so reliably, and it is disabled entirely when the tail call's arguments require more stack than the caller's own frame.

The safe pattern is an explicit stack, as in the iterative depth-first search used elsewhere in this encyclopedia.

```c
#include <stdio.h>
#include <stdlib.h>

/* One frame per vertex on the current path, holding the vertex and the
   index of the next neighbour to examine. This mirrors a recursive call
   exactly, so the visit order is the same, and the stack holds at most n
   frames because every frame belongs to a distinct visited vertex. */
typedef struct {
    int vertex;
    int next;
} dfs_frame;

static int reachable_count(const int *const *neighbours, const int *degree,
                            int n, int source) {
    if (n <= 0 || source < 0 || source >= n) {
        return 0;
    }
    char *visited = calloc((size_t)n, sizeof *visited);
    dfs_frame *stack = malloc((size_t)n * sizeof *stack);
    if (visited == NULL || stack == NULL) {
        free(visited);
        free(stack);
        return 0;
    }

    int top = 0;
    stack[top].vertex = source;
    stack[top].next = 0;
    top++;
    visited[source] = 1;
    int count = 1;

    while (top > 0) {
        dfs_frame *frame = &stack[top - 1];
        if (frame->next < degree[frame->vertex]) {
            const int w = neighbours[frame->vertex][frame->next];
            frame->next++;
            if (visited[w]) {
                continue;
            }
            visited[w] = 1;
            count++;
            stack[top].vertex = w;
            stack[top].next = 0;
            top++;
        } else {
            top--;
        }
    }

    free(visited);
    free(stack);
    return count;
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2 || n <= 0) {
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    int *edge_u = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_u);
    int *edge_v = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_v);
    int *degree = calloc((size_t)n, sizeof *degree);
    if (edge_u == NULL || edge_v == NULL || degree == NULL) {
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edge_u[kept] = u;
        edge_v[kept] = v;
        kept++;
        degree[u]++;
        degree[v]++;
    }

    int source = 0;
    if (scanf("%d", &source) != 1) {
        source = 0;
    }

    int **neighbours = calloc((size_t)n, sizeof *neighbours);
    int *cursor = calloc((size_t)n, sizeof *cursor);
    if (neighbours == NULL || cursor == NULL) {
        for (int v = 0; v < n; v++) {
            free(neighbours[v]);
        }
        free(neighbours);
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }
    for (int v = 0; v < n; v++) {
        neighbours[v] =
            malloc((size_t)(degree[v] > 0 ? degree[v] : 1) * sizeof(int));
        if (neighbours[v] == NULL) {
            for (int u = 0; u < n; u++) {
                free(neighbours[u]);
            }
            free(neighbours);
            free(edge_u);
            free(edge_v);
            free(degree);
            return 0;
        }
    }
    for (int i = 0; i < kept; i++) {
        neighbours[edge_u[i]][cursor[edge_u[i]]++] = edge_v[i];
        neighbours[edge_v[i]][cursor[edge_v[i]]++] = edge_u[i];
    }

    printf("%d\n", reachable_count((const int *const *)neighbours, degree, n,
                                   source));

    for (int v = 0; v < n; v++) {
        free(neighbours[v]);
    }
    free(neighbours);
    free(edge_u);
    free(edge_v);
    free(degree);
    free(cursor);
    return 0;
}
```

## Debugging advice

Compile with `-g` while debugging and keep the sanitizers on until the program is correct. The `-Werror` flag will not let a warning survive, so the compiler becomes part of the review.

When a C program gives a wrong answer, the first three things to check are the shape of the data rather than the algorithm. Check that the loop variable is compared against the size and not against the capacity. Check that the index used to write is the same index used to read. Check that every allocation that can fail is tested, because a failed `malloc` that returns `NULL` will be dereferenced somewhere later and the crash will point at the wrong line.

Use `assert` from `<assert.h>` for the invariants that hold by construction, such as "the heap size never exceeds the capacity" or "the index is inside the array". Remember that `assert` compiles to nothing when `NDEBUG` is defined, so it disappears from an optimized build; that is the intent, and it means an assert must never have a side effect.

When the output is wrong but the program does not crash, print to `stderr` rather than `stdout`. The judge reads `stdout`, and a stray diagnostic there is a wrong answer on every test.

## Template library

The C templates in this section are complete programs. Copy one, rename `main`, and replace the body of the solver.

**A general program.** Read a count, read that many values, solve, print the answer, and release everything.

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 0) {
        return 0;
    }

    int *values = NULL;
    if (n > 0) {
        values = malloc((size_t)n * sizeof *values);
        if (values == NULL) {
            return 0;
        }
    }

    int read = 0;
    for (; read < n; read++) {
        if (scanf("%d", &values[read]) != 1) {
            break;
        }
    }
    n = read;

    /* Solve the problem here, using values[0..n-1]. */

    for (int i = 0; i < n; i++) {
        printf("%d%c", values[i], (i + 1 == n) ? '\n' : ' ');
    }
    if (n == 0) {
        putchar('\n');
    }

    free(values);
    return 0;
}
```

**Graph input.** Read `n m`, then `m` edges, then a start vertex, into an adjacency list whose every allocation has a matching release.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *neighbours;
    int degree;
} adjacency_list;

static void adjacency_list_free(adjacency_list *adj, int n) {
    for (int v = 0; v < n; v++) {
        free(adj[v].neighbours);
    }
    free(adj);
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2 || n <= 0) {
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    int *edge_u = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_u);
    int *edge_v = malloc((size_t)(m > 0 ? m : 1) * sizeof *edge_v);
    int *degree = calloc((size_t)n, sizeof *degree);
    if (edge_u == NULL || edge_v == NULL || degree == NULL) {
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        if (scanf("%d %d", &u, &v) != 2) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edge_u[kept] = u;
        edge_v[kept] = v;
        kept++;
        degree[u]++;
        degree[v]++;
    }

    int source = -1;
    if (scanf("%d", &source) != 1) {
        source = -1;
    }

    adjacency_list *adj = calloc((size_t)n, sizeof *adj);
    int *cursor = calloc((size_t)n, sizeof *cursor);
    if (adj == NULL || cursor == NULL) {
        adjacency_list_free(adj, n);
        free(edge_u);
        free(edge_v);
        free(degree);
        return 0;
    }
    for (int v = 0; v < n; v++) {
        adj[v].degree = degree[v];
        if (degree[v] > 0) {
            adj[v].neighbours = malloc((size_t)degree[v] * sizeof(int));
            if (adj[v].neighbours == NULL) {
                adjacency_list_free(adj, n);
                free(edge_u);
                free(edge_v);
                free(degree);
                return 0;
            }
        }
    }
    for (int i = 0; i < kept; i++) {
        const int u = edge_u[i];
        const int v = edge_v[i];
        adj[u].neighbours[cursor[u]++] = v;
        adj[v].neighbours[cursor[v]++] = u;
    }

    /* Solve the problem here, using adj and source. */

    adjacency_list_free(adj, n);
    free(edge_u);
    free(edge_v);
    free(degree);
    free(cursor);
    return 0;
}
```

**A dynamic array of `long long`.** Use it when the length is not known until the input has been read.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long *items;
    int size;
    int capacity;
} int64_array;

static void int64_array_free(int64_array *array) {
    free(array->items);
    array->items = NULL;
    array->size = 0;
    array->capacity = 0;
}

static int int64_array_push(int64_array *array, long long value) {
    if (array->size == array->capacity) {
        const int capacity = array->capacity == 0 ? 8 : 2 * array->capacity;
        long long *items = realloc(array->items, (size_t)capacity * sizeof *items);
        if (items == NULL) {
            return 0;
        }
        array->items = items;
        array->capacity = capacity;
    }
    array->items[array->size++] = value;
    return 1;
}

int main(void) {
    int64_array array = {NULL, 0, 0};
    long long value = 0;
    while (scanf("%lld", &value) == 1) {
        if (!int64_array_push(&array, value)) {
            int64_array_free(&array);
            return 0;
        }
    }
    long long total = 0;
    for (int i = 0; i < array.size; i++) {
        total += array.items[i];
    }
    printf("%lld\n", total);
    int64_array_free(&array);
    return 0;
}
```

## What to remember

C is worth learning for three reasons. It makes the memory model of every other language visible, it is the language in which the standard library forces you to state your invariants, and it is one of the four languages USACO accepts for submission.

The three rules that carry most of the weight are these. Check every allocation, and release it exactly once on every path. Check every index, because the language will not. And treat the depth of the call stack as a resource to be bounded, not as a consequence of the algorithm.
