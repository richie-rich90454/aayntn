#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * Larger than any shortest path this program can build from two finite values,
 * so the guarded addition below cannot overflow a 64-bit integer.
 */
#define INF 4000000000000000000LL

typedef struct {
    int from;
    int to;
    long long weight;
} Edge;

typedef struct {
    int to;
    long long weight;
    int next;
} Arc;

typedef struct {
    long long key;
    int vertex;
} HeapEntry;

typedef struct {
    HeapEntry *items;
    int size;
    int capacity;
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

int main(void) {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2) {
        return 0;
    }
    if (n <= 0) {
        printf("\n");
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    Edge *edges = malloc(((size_t)m + 1) * sizeof *edges);
    int *head = malloc((size_t)n * sizeof *head);
    Arc *arcs = malloc(((size_t)m + 1) * sizeof *arcs);
    long long *height = malloc((size_t)n * sizeof *height);
    long long *distance = malloc((size_t)n * sizeof *distance);
    Heap heap;
    heap.size = 0;
    heap.capacity = m + n + 1;
    heap.items = malloc((size_t)heap.capacity * sizeof *heap.items);
    if (edges == NULL || head == NULL || arcs == NULL || height == NULL || distance == NULL ||
        heap.items == NULL) {
        free(edges);
        free(head);
        free(arcs);
        free(height);
        free(distance);
        free(heap.items);
        return 0;
    }

    int count = 0;
    for (int e = 0; e < m; e++) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (scanf("%d %d %lld", &u, &v, &w) != 3) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        edges[count].from = u;
        edges[count].to = v;
        edges[count].weight = w;
        count++;
    }

    /*
     * Every vertex starts at zero, as if a virtual source were joined to it by
     * an edge of weight zero. n relaxation passes then either produce the
     * potentials or expose a negative cycle.
     */
    for (int v = 0; v < n; v++) {
        height[v] = 0;
    }
    int negative_cycle = 0;
    for (int pass = 0; pass < n; pass++) {
        int changed = 0;
        for (int e = 0; e < count; e++) {
            const int u = edges[e].from;
            const int v = edges[e].to;
            if (height[u] == INF) {
                continue;
            }
            const long long candidate = height[u] + edges[e].weight;
            if (candidate < height[v]) {
                height[v] = candidate;
                changed = 1;
            }
        }
        if (!changed) {
            negative_cycle = 0;
            break;
        }
        if (pass == n - 1) {
            negative_cycle = 1;
        }
    }
    if (negative_cycle) {
        printf("NEGATIVE CYCLE\n");
        free(edges);
        free(head);
        free(arcs);
        free(height);
        free(distance);
        free(heap.items);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        head[v] = -1;
    }
    for (int e = 0; e < count; e++) {
        const int u = edges[e].from;
        const int v = edges[e].to;
        /* The reduced weight is nonnegative: height[v] <= height[u] + w. */
        arcs[e].to = v;
        arcs[e].weight = edges[e].weight + height[u] - height[v];
        arcs[e].next = head[u];
        head[u] = e;
    }

    for (int source = 0; source < n; source++) {
        for (int v = 0; v < n; v++) {
            distance[v] = INF;
        }
        distance[source] = 0;
        heap.size = 0;
        heap_push(&heap, 0, source);
        while (heap.size > 0) {
            const HeapEntry current = heap_pop(&heap);
            if (current.key != distance[current.vertex]) {
                continue;
            }
            for (int at = head[current.vertex]; at != -1; at = arcs[at].next) {
                const long long candidate = current.key + arcs[at].weight;
                if (candidate < distance[arcs[at].to]) {
                    distance[arcs[at].to] = candidate;
                    heap_push(&heap, candidate, arcs[at].to);
                }
            }
        }
        for (int v = 0; v < n; v++) {
            if (v > 0) {
                putchar(' ');
            }
            if (distance[v] == INF) {
                printf("-1");
            } else {
                printf("%lld", distance[v] - height[source] + height[v]);
            }
        }
        putchar('\n');
    }

    free(edges);
    free(head);
    free(arcs);
    free(height);
    free(distance);
    free(heap.items);
    return 0;
}
