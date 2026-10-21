#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A weighted adjacency list for a graph on vertices 0..n-1: edges lists the
 * incident edges and degree is their count.
 */
typedef struct {
    int vertex;
    long long weight;
} weighted_edge;

typedef struct {
    weighted_edge *edges;
    int degree;
} adjacency_list;

/*
 * A binary min-heap of (distance, vertex) pairs ordered by distance. Ties are
 * broken by the heap layout, which cannot change the result: the shortest
 * distance of a vertex is unique.
 */
typedef struct {
    long long distance;
    int vertex;
} heap_entry;

typedef struct {
    heap_entry *entries;
    int size;
    int capacity;
} min_heap;

/* An edge as it is read from the input, before the adjacency list is built. */
typedef struct {
    int u;
    int v;
    long long weight;
} input_edge;

/* Moves the entry at index up until its parent is not larger. */
static void heap_sift_up(min_heap *heap, int index) {
    while (index > 0) {
        const int parent = (index - 1) / 2;
        if (heap->entries[parent].distance <= heap->entries[index].distance) {
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
            heap->entries[child + 1].distance < heap->entries[child].distance) {
            child++;
        }
        if (heap->entries[index].distance <= heap->entries[child].distance) {
            break;
        }
        const heap_entry swap = heap->entries[index];
        heap->entries[index] = heap->entries[child];
        heap->entries[child] = swap;
        index = child;
    }
}

/* Adds an entry, doubling the backing array when it is full. */
static int heap_push(min_heap *heap, long long distance, int vertex) {
    if (heap->size == heap->capacity) {
        const int capacity = heap->capacity == 0 ? 8 : 2 * heap->capacity;
        heap_entry *entries = realloc(heap->entries, (size_t)capacity * sizeof *entries);
        if (entries == NULL) {
            return 0;
        }
        heap->entries = entries;
        heap->capacity = capacity;
    }
    heap->entries[heap->size].distance = distance;
    heap->entries[heap->size].vertex = vertex;
    heap->size++;
    heap_sift_up(heap, heap->size - 1);
    return 1;
}

/* Removes the smallest entry and reports it through entry. */
static int heap_pop(min_heap *heap, heap_entry *entry) {
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

/**
 * Dijkstra's algorithm from source over a graph whose edge weights are all
 * nonnegative.
 *
 * The heap holds (distance, vertex) pairs and an entry is never removed from
 * the middle of the heap: a shorter path to a vertex pushes a second entry and
 * the stale one is discarded when it surfaces. That replaces a decrease-key
 * operation by at most one extra entry per successful relaxation, so the heap
 * holds O(E) entries.
 *
 * adj       adjacency list of the graph
 * n         number of vertices, labeled 0..n-1
 * source    the start vertex
 * distance  receives the distance from source to every vertex and -1 for the
 *           vertices source cannot reach; room for n entries
 * returns   0 on success, -1 when the heap could not be grown
 */
static int dijkstra_distances(const adjacency_list *adj, int n, int source,
                              long long *distance) {
    for (int v = 0; v < n; v++) {
        distance[v] = -1;
    }
    if (n <= 0 || source < 0 || source >= n) {
        return 0;
    }

    min_heap heap = {NULL, 0, 0};
    if (!heap_push(&heap, 0, source)) {
        return -1;
    }
    distance[source] = 0;

    heap_entry top;
    while (heap_pop(&heap, &top)) {
        if (top.distance != distance[top.vertex]) {
            /* A shorter path was found after this entry was pushed. */
            continue;
        }
        for (int i = 0; i < adj[top.vertex].degree; i++) {
            const weighted_edge *edge = &adj[top.vertex].edges[i];
            const long long candidate = top.distance + edge->weight;
            if (distance[edge->vertex] >= 0 && candidate >= distance[edge->vertex]) {
                /* The relaxation would not improve the distance. */
                continue;
            }
            distance[edge->vertex] = candidate;
            if (!heap_push(&heap, candidate, edge->vertex)) {
                free(heap.entries);
                return -1;
            }
        }
    }

    free(heap.entries);
    return 0;
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

    input_edge *edges = m > 0 ? malloc((size_t)m * sizeof *edges) : NULL;
    int *degree = calloc((size_t)n, sizeof *degree);
    long long *distance = malloc((size_t)n * sizeof *distance);
    if ((m > 0 && edges == NULL) || degree == NULL || distance == NULL) {
        free(edges);
        free(degree);
        free(distance);
        return 0;
    }

    int kept = 0;
    for (int i = 0; i < m; i++) {
        int u = 0;
        int v = 0;
        long long w = 0;
        if (scanf("%d %d %lld", &u, &v, &w) != 3) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
            continue;
        }
        edges[kept].u = u;
        edges[kept].v = v;
        edges[kept].weight = w;
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
        free(adj);
        free(cursor);
        free(edges);
        free(degree);
        free(distance);
        return 0;
    }

    for (int v = 0; v < n; v++) {
        adj[v].degree = degree[v];
        if (degree[v] > 0) {
            adj[v].edges = malloc((size_t)degree[v] * sizeof *adj[v].edges);
            if (adj[v].edges == NULL) {
                for (int u = 0; u < n; u++) {
                    free(adj[u].edges);
                }
                free(adj);
                free(cursor);
                free(edges);
                free(degree);
                free(distance);
                return 0;
            }
        }
    }
    for (int i = 0; i < kept; i++) {
        const int u = edges[i].u;
        const int v = edges[i].v;
        adj[u].edges[cursor[u]].vertex = v;
        adj[u].edges[cursor[u]].weight = edges[i].weight;
        cursor[u]++;
        adj[v].edges[cursor[v]].vertex = u;
        adj[v].edges[cursor[v]].weight = edges[i].weight;
        cursor[v]++;
    }

    dijkstra_distances(adj, n, source, distance);

    for (int v = 0; v < n; v++) {
        if (v > 0) {
            putchar(' ');
        }
        printf("%lld", distance[v]);
    }
    putchar('\n');

    for (int v = 0; v < n; v++) {
        free(adj[v].edges);
    }
    free(adj);
    free(cursor);
    free(edges);
    free(degree);
    free(distance);
    return 0;
}
