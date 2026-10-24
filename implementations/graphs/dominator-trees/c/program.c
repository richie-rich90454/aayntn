#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A directed adjacency list stored as a head array and a linked list of edges.
 * Edge e runs from some vertex to to[e], and next[e] is the next edge out of
 * the same vertex, or -1 when it is the last one.
 */
typedef struct {
    int *head;
    int *to;
    int *next;
} adjacency_list;

/* Appends the edge from -> to to the list. */
static void add_edge(adjacency_list *list, int from, int to, int slot) {
    list->to[slot] = to;
    list->next[slot] = list->head[from];
    list->head[from] = slot;
}

/*
 * The deepest common ancestor of a and b in the partially built dominator
 * tree. An ancestor has a smaller reverse-postorder number than any of its
 * descendants, so the walk always climbs the vertex with the larger number.
 */
static int intersect(int a, int b, const int *idom, const int *order) {
    while (a != b) {
        while (order[a] > order[b]) {
            a = idom[a];
        }
        while (order[b] > order[a]) {
            b = idom[b];
        }
    }
    return a;
}

/**
 * The immediate dominator of every vertex, found with the iterative dataflow
 * algorithm of Cooper, Harvey and Kennedy.
 *
 * adj       the successor lists
 * pred      the predecessor lists
 * n         the number of vertices, labeled 0..n-1
 * source    the start vertex
 * idom      receives the immediate dominator of every vertex, -1 for the
 *           vertices the source cannot reach, and source for the source
 */
static void immediate_dominators(const adjacency_list *adj, const adjacency_list *pred, int n,
                                 int source, int *idom) {
    int *visited = calloc((size_t)n, sizeof *visited);
    int *next_edge = malloc((size_t)n * sizeof *next_edge);
    int *postorder = malloc((size_t)n * sizeof *postorder);
    int *order = malloc((size_t)n * sizeof *order);
    int *stack = malloc((size_t)n * sizeof *stack);
    int *rpo = malloc((size_t)n * sizeof *rpo);
    if (visited == NULL || next_edge == NULL || postorder == NULL || order == NULL ||
        stack == NULL || rpo == NULL) {
        free(visited);
        free(next_edge);
        free(postorder);
        free(order);
        free(stack);
        free(rpo);
        for (int v = 0; v < n; v++) {
            idom[v] = -1;
        }
        return;
    }

    for (int v = 0; v < n; v++) {
        idom[v] = -1;
        order[v] = -1;
        next_edge[v] = adj->head[v];
    }
    if (source < 0 || source >= n) {
        free(visited);
        free(next_edge);
        free(postorder);
        free(order);
        free(stack);
        free(rpo);
        return;
    }

    /*
     * Iterative depth-first search. A vertex enters the postorder when its
     * last successor has been examined, and the reverse of that order is the
     * order the dominator computation needs.
     */
    int top = 0;
    int postorder_length = 0;
    visited[source] = 1;
    stack[top++] = source;
    while (top > 0) {
        const int v = stack[top - 1];
        int e = next_edge[v];
        while (e != -1 && visited[adj->to[e]]) {
            e = adj->next[e];
        }
        next_edge[v] = e;
        if (e == -1) {
            postorder[postorder_length++] = v;
            top--;
        } else {
            next_edge[v] = adj->next[e];
            const int w = adj->to[e];
            visited[w] = 1;
            stack[top++] = w;
        }
    }

    for (int i = 0; i < postorder_length; i++) {
        rpo[i] = postorder[postorder_length - 1 - i];
        order[rpo[i]] = i;
    }

    idom[source] = source;
    int changed = 1;
    while (changed) {
        changed = 0;
        for (int i = 1; i < postorder_length; i++) {
            const int v = rpo[i];
            int candidate = -1;
            for (int e = pred->head[v]; e != -1; e = pred->next[e]) {
                const int p = pred->to[e];
                if (idom[p] == -1) {
                    /* The predecessor is not reachable from the source. */
                    continue;
                }
                candidate = candidate == -1 ? p : intersect(p, candidate, idom, order);
            }
            if (candidate != -1 && idom[v] != candidate) {
                idom[v] = candidate;
                changed = 1;
            }
        }
    }

    free(visited);
    free(next_edge);
    free(postorder);
    free(order);
    free(stack);
    free(rpo);
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
    int source = -1;
    if (scanf("%d %d %d", &n, &m, &source) != 3) {
        return 0;
    }
    if (n <= 0) {
        printf("\n");
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    adjacency_list adj;
    adjacency_list pred;
    adj.head = malloc((size_t)n * sizeof *adj.head);
    pred.head = malloc((size_t)n * sizeof *pred.head);
    adj.to = m > 0 ? malloc((size_t)m * sizeof *adj.to) : NULL;
    adj.next = m > 0 ? malloc((size_t)m * sizeof *adj.next) : NULL;
    pred.to = m > 0 ? malloc((size_t)m * sizeof *pred.to) : NULL;
    pred.next = m > 0 ? malloc((size_t)m * sizeof *pred.next) : NULL;
    int *idom = malloc((size_t)n * sizeof *idom);
    if (adj.head == NULL || pred.head == NULL || idom == NULL ||
        (m > 0 && (adj.to == NULL || adj.next == NULL || pred.to == NULL ||
                   pred.next == NULL))) {
        free(adj.head);
        free(pred.head);
        free(adj.to);
        free(adj.next);
        free(pred.to);
        free(pred.next);
        free(idom);
        return 0;
    }
    for (int v = 0; v < n; v++) {
        adj.head[v] = -1;
        pred.head[v] = -1;
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
        add_edge(&adj, u, v, kept);
        add_edge(&pred, v, u, kept);
        kept++;
    }
    /*
     * Edges after the first unreadable one were not stored, so the lists stop
     * at kept. Nothing else needs them.
     */

    immediate_dominators(&adj, &pred, n, source, idom);

    for (int v = 0; v < n; v++) {
        if (v > 0) {
            putchar(' ');
        }
        if (v == source) {
            printf("0");
        } else {
            printf("%d", idom[v]);
        }
    }
    putchar('\n');

    free(adj.head);
    free(pred.head);
    free(adj.to);
    free(adj.next);
    free(pred.to);
    free(pred.next);
    free(idom);
    return 0;
}
