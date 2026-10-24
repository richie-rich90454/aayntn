#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int u;
    int v;
    long long weight;
} Edge;

static int compare_edges(const void *left, const void *right) {
    const Edge *a = (const Edge *)left;
    const Edge *b = (const Edge *)right;
    if (a->weight > b->weight) {
        return -1;
    }
    if (a->weight < b->weight) {
        return 1;
    }
    return 0;
}

static int find_root(int *parent, int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

static int unite(int *parent, int *size, int a, int b) {
    int ra = find_root(parent, a);
    int rb = find_root(parent, b);
    if (ra == rb) {
        return 0;
    }
    if (size[ra] < size[rb]) {
        int temporary = ra;
        ra = rb;
        rb = temporary;
    }
    parent[rb] = ra;
    size[ra] += size[rb];
    return 1;
}

int main(void) {
    int n = 0;
    int m = 0;
    if (scanf("%d %d", &n, &m) != 2 || n < 0 || m < 0) {
        return 0;
    }

    Edge *edges = NULL;
    if (m > 0) {
        edges = (Edge *)malloc((size_t)m * sizeof(Edge));
        if (edges == NULL) {
            return 0;
        }
    }
    for (int k = 0; k < m; k++) {
        if (scanf("%d %d %lld", &edges[k].u, &edges[k].v, &edges[k].weight) != 3) {
            m = k;
            break;
        }
        edges[k].u -= 1;
        edges[k].v -= 1;
    }

    if (n < 1) {
        free(edges);
        printf("0\n");
        return 0;
    }

    int *parent = (int *)malloc((size_t)n * sizeof(int));
    int *size = (int *)malloc((size_t)n * sizeof(int));
    if (parent == NULL || size == NULL) {
        free(parent);
        free(size);
        free(edges);
        return 0;
    }
    for (int k = 0; k < n; k++) {
        parent[k] = k;
        size[k] = 1;
    }

    if (m > 1) {
        qsort(edges, (size_t)m, sizeof(Edge), compare_edges);
    }

    long long total = 0;
    for (int k = 0; k < m; k++) {
        if (unite(parent, size, edges[k].u, edges[k].v)) {
            total += edges[k].weight;
        }
    }
    printf("%lld\n", total);

    free(parent);
    free(size);
    free(edges);
    return 0;
}
