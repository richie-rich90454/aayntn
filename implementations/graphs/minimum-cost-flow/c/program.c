#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/* Larger than any distance the program can build from two finite values. */
#define INF 4000000000000000000LL

typedef struct {
    int to;
    int next;
    long long cap;
    long long cost;
} Arc;

typedef struct {
    long long key;
    int vertex;
} HeapEntry;

typedef struct {
    HeapEntry *items;
    int size;
} Heap;

static void heap_push(Heap *heap, long long key, int vertex) {
    int index = heap->size++;
    while (index > 0) {
        const int parent = (index - 1) / 2;
        if (heap->items[parent].key <= key) {
            break;
        }
        heap->items[index] = heap->items[parent];
        index = parent;
    }
    heap->items[index].key = key;
    heap->items[index].vertex = vertex;
}

static HeapEntry heap_pop(Heap *heap) {
    const HeapEntry top = heap->items[0];
    const HeapEntry last = heap->items[--heap->size];
    int index = 0;
    for (;;) {
        const int left = 2 * index + 1;
        if (left >= heap->size) {
            break;
        }
        const int right = left + 1;
        const int child =
            (right < heap->size && heap->items[right].key < heap->items[left].key) ? right : left;
        if (heap->items[child].key >= last.key) {
            break;
        }
        heap->items[index] = heap->items[child];
        index = child;
    }
    if (heap->size > 0) {
        heap->items[index] = last;
    }
    return top;
}

static void add_edge(Arc *arcs, int *head, int *count, int u, int v, long long cap,
                     long long cost) {
    arcs[*count].to = v;
    arcs[*count].cap = cap;
    arcs[*count].cost = cost;
    arcs[*count].next = head[u];
    head[u] = *count;
    (*count)++;
    arcs[*count].to = u;
    arcs[*count].cap = 0;
    arcs[*count].cost = -cost;
    arcs[*count].next = head[v];
    head[v] = *count;
    (*count)++;
}

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int m = 0;
    int s = 0;
    int t = 0;
    if (scanf("%d %d %d %d", &n, &m, &s, &t) != 4) {
        return 0;
    }
    if (n <= 0 || s < 0 || s >= n || t < 0 || t >= n || s == t) {
        printf("0 0\n");
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    Arc *arcs = malloc(((size_t)2 * (size_t)m + 2) * sizeof *arcs);
    int *head = malloc((size_t)n * sizeof *head);
    long long *height = calloc((size_t)n, sizeof *height);
    long long *distance = malloc((size_t)n * sizeof *distance);
    int *previous = malloc((size_t)n * sizeof *previous);
    Heap heap;
    heap.size = 0;
    heap.items = malloc(((size_t)2 * (size_t)m + 3) * sizeof *heap.items);
    if (arcs == NULL || head == NULL || height == NULL || distance == NULL ||
        previous == NULL || heap.items == NULL) {
        free(arcs);
        free(head);
        free(height);
        free(distance);
        free(previous);
        free(heap.items);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        head[v] = -1;
    }
    int count = 0;
    for (int e = 0; e < m; e++) {
        int u = 0;
        int v = 0;
        long long cap = 0;
        long long cost = 0;
        if (scanf("%d %d %lld %lld", &u, &v, &cap, &cost) != 4) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n || cap < 0) {
            continue;
        }
        add_edge(arcs, head, &count, u, v, cap, cost);
    }

    long long flow = 0;
    long long total = 0;
    for (;;) {
        for (int v = 0; v < n; v++) {
            distance[v] = INF;
            previous[v] = -1;
        }
        distance[s] = 0;
        heap.size = 0;
        heap_push(&heap, 0, s);
        while (heap.size > 0) {
            const HeapEntry current = heap_pop(&heap);
            if (current.key != distance[current.vertex]) {
                continue;
            }
            for (int at = head[current.vertex]; at != -1; at = arcs[at].next) {
                if (arcs[at].cap <= 0) {
                    continue;
                }
                /* The reduced cost is nonnegative while the potentials are feasible. */
                const long long candidate = current.key + arcs[at].cost +
                                            height[current.vertex] - height[arcs[at].to];
                if (candidate < distance[arcs[at].to]) {
                    distance[arcs[at].to] = candidate;
                    previous[arcs[at].to] = at;
                    heap_push(&heap, candidate, arcs[at].to);
                }
            }
        }
        if (distance[t] == INF) {
            break;
        }
        for (int v = 0; v < n; v++) {
            if (distance[v] < INF) {
                height[v] += distance[v];
            }
        }

        long long add = INF;
        for (int v = t; v != s; v = arcs[previous[v] ^ 1].to) {
            if (arcs[previous[v]].cap < add) {
                add = arcs[previous[v]].cap;
            }
        }
        for (int v = t; v != s; v = arcs[previous[v] ^ 1].to) {
            arcs[previous[v]].cap -= add;
            arcs[previous[v] ^ 1].cap += add;
        }
        flow += add;
        total += add * (height[t] - height[s]);
    }

    printf("%lld %lld\n", flow, total);

    free(arcs);
    free(head);
    free(height);
    free(distance);
    free(previous);
    free(heap.items);
    return 0;
}
