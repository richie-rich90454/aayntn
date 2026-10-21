#include <stdlib.h>

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
 * n         number of vertices, labelled 0..n-1
 * source    the start vertex
 * distance  receives the distance from source to every vertex and -1 for the
 *           vertices source cannot reach; room for n entries, owned by the
 *           caller
 * returns   0 on success, -1 when the heap could not be grown
 */
int dijkstra_distances(const adjacency_list *adj, int n, int source, long long *distance) {
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

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main(void) {
    weighted_edge from_zero[] = {{1, 4}, {2, 2}};
    weighted_edge from_one[] = {{0, 4}, {2, 1}};
    weighted_edge from_two[] = {{0, 2}, {1, 1}, {3, 8}};
    weighted_edge from_three[] = {{2, 8}};
    adjacency_list graph[5] = {
        {from_zero, 2},
        {from_one, 2},
        {from_two, 3},
        {from_three, 1},
        {NULL, 0},
    };
    long long distance[5];

    if (dijkstra_distances(graph, 5, 0, distance) != 0) {
        return EXIT_FAILURE;
    }
    if (distance[0] != 0 || distance[1] != 3 || distance[2] != 2 ||
        distance[3] != 10 || distance[4] != -1) {
        return EXIT_FAILURE;
    }

    /* The start vertex is the only one reachable from an isolated vertex. */
    if (dijkstra_distances(graph, 5, 4, distance) != 0) {
        return EXIT_FAILURE;
    }
    if (distance[0] != -1 || distance[1] != -1 || distance[2] != -1 ||
        distance[3] != -1 || distance[4] != 0) {
        return EXIT_FAILURE;
    }

    /* A start vertex outside the graph leaves every distance unknown. */
    if (dijkstra_distances(graph, 5, 5, distance) != 0) {
        return EXIT_FAILURE;
    }
    if (distance[0] != -1 || distance[4] != -1) {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
