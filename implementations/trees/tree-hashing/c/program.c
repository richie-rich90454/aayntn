#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define BASE_FIRST 1000003u
#define BASE_SECOND 999983u

/* Two unsigned 32-bit fingerprints of one rooted subtree. */
typedef struct {
    uint32_t first;
    uint32_t second;
} subtree_hash;

typedef struct {
    int size;
    int root;
    int *parent;
    int *start;
    int *children;
    uint32_t *first;
    uint32_t *second;
} tree_hash;

/* A fixed 32-bit permutation, used to keep the fold from being linear. */
static uint32_t mix_first(uint32_t value) {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
}

/* A second, differently shaped permutation for the other fingerprint. */
static uint32_t mix_second(uint32_t value) {
    value += 0x9e3779b9u;
    value ^= value << 5;
    value ^= value >> 13;
    value ^= value << 17;
    return value;
}

static int compare_hashes(const void *left, const void *right) {
    const subtree_hash *a = left;
    const subtree_hash *b = right;
    if (a->first != b->first) {
        return a->first < b->first ? -1 : 1;
    }
    if (a->second != b->second) {
        return a->second < b->second ? -1 : 1;
    }
    return 0;
}

static void free_tree(tree_hash *tree) {
    free(tree->parent);
    free(tree->start);
    free(tree->children);
    free(tree->first);
    free(tree->second);
    tree->parent = NULL;
    tree->start = NULL;
    tree->children = NULL;
    tree->first = NULL;
    tree->second = NULL;
    tree->size = 0;
    tree->root = 0;
}

/*
 * Read n parents, build the children lists, and hash every subtree bottom-up.
 * A parent of -1 (or of an index outside 0..n-1) marks a root; the first such
 * vertex is used, and vertex 0 is used if the input has no root at all.
 */
static int read_tree(tree_hash *tree, int n) {
    tree->size = n;
    tree->root = -1;
    tree->parent = NULL;
    tree->start = NULL;
    tree->children = NULL;
    tree->first = NULL;
    tree->second = NULL;

    const size_t vertices = (size_t)n;
    const size_t child_slots = n > 1 ? (size_t)(n - 1) : 1;

    tree->parent = malloc(vertices * sizeof *tree->parent);
    tree->start = malloc((vertices + 1) * sizeof *tree->start);
    tree->children = malloc(child_slots * sizeof *tree->children);
    tree->first = malloc(vertices * sizeof *tree->first);
    tree->second = malloc(vertices * sizeof *tree->second);
    int *count = calloc(vertices, sizeof *count);
    int *cursor = calloc(vertices, sizeof *cursor);
    int *order = malloc(vertices * sizeof *order);
    subtree_hash *buffer = malloc(vertices * sizeof *buffer);

    if (tree->parent == NULL || tree->start == NULL || tree->children == NULL ||
        tree->first == NULL || tree->second == NULL || count == NULL ||
        cursor == NULL || order == NULL || buffer == NULL) {
        free(count);
        free(cursor);
        free(order);
        free(buffer);
        free_tree(tree);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%d", &tree->parent[i]) != 1) {
            tree->parent[i] = -1;
        }
    }

    for (int i = 0; i < n; i++) {
        if (tree->parent[i] < 0 || tree->parent[i] >= n) {
            tree->parent[i] = -1;
            if (tree->root < 0) {
                tree->root = i;
            }
        }
    }
    if (tree->root < 0) {
        tree->root = 0;
        tree->parent[0] = -1;
    }

    for (int i = 0; i < n; i++) {
        const int p = tree->parent[i];
        if (i != tree->root && p >= 0) {
            count[p]++;
        }
    }
    tree->start[0] = 0;
    for (int i = 0; i < n; i++) {
        tree->start[i + 1] = tree->start[i] + count[i];
    }
    for (int i = 0; i < n; i++) {
        const int p = tree->parent[i];
        if (i != tree->root && p >= 0) {
            tree->children[tree->start[p] + cursor[p]] = i;
            cursor[p]++;
        }
    }

    /* A breadth-first order has every parent before its children. */
    int order_count = 0;
    order[order_count++] = tree->root;
    for (int head = 0; head < order_count; head++) {
        const int u = order[head];
        for (int e = tree->start[u]; e < tree->start[u + 1]; e++) {
            order[order_count++] = tree->children[e];
        }
    }

    for (int i = 0; i < n; i++) {
        tree->first[i] = 0;
        tree->second[i] = 0;
    }

    /* The reverse of the order puts every child before its parent. */
    for (int index = order_count - 1; index >= 0; index--) {
        const int u = order[index];
        int degree = 0;
        for (int e = tree->start[u]; e < tree->start[u + 1]; e++) {
            const int c = tree->children[e];
            buffer[degree].first = tree->first[c];
            buffer[degree].second = tree->second[c];
            degree++;
        }
        qsort(buffer, (size_t)degree, sizeof *buffer, compare_hashes);

        uint32_t fold_first = 0;
        uint32_t fold_second = 0;
        for (int i = 0; i < degree; i++) {
            fold_first = fold_first * BASE_FIRST + mix_first(buffer[i].first);
            fold_second = fold_second * BASE_SECOND + mix_second(buffer[i].second);
        }
        tree->first[u] = fold_first * BASE_FIRST + 1;
        tree->second[u] = fold_second * BASE_SECOND + 1;
    }

    free(count);
    free(cursor);
    free(order);
    free(buffer);
    return 1;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 1) {
        printf("DIFFERENT\n");
        return 0;
    }

    tree_hash first_tree = {0, 0, NULL, NULL, NULL, NULL, NULL};
    if (!read_tree(&first_tree, n)) {
        printf("DIFFERENT\n");
        return 0;
    }

    int m = 0;
    if (scanf("%d", &m) != 1 || m < 1) {
        free_tree(&first_tree);
        printf("DIFFERENT\n");
        return 0;
    }

    tree_hash second_tree = {0, 0, NULL, NULL, NULL, NULL, NULL};
    if (!read_tree(&second_tree, m)) {
        free_tree(&first_tree);
        printf("DIFFERENT\n");
        return 0;
    }

    const int same = first_tree.size == second_tree.size &&
                     first_tree.first[first_tree.root] ==
                         second_tree.first[second_tree.root] &&
                     first_tree.second[first_tree.root] ==
                         second_tree.second[second_tree.root];
    printf(same ? "SAME\n" : "DIFFERENT\n");

    free_tree(&first_tree);
    free_tree(&second_tree);
    return 0;
}
