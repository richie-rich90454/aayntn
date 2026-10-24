#include <stdio.h>
#include <stdlib.h>

/*
 * Reads a set of allowed moves and a list of heap sizes, tabulates the Grundy
 * value of one heap, prints the value of every heap, and reports whether the
 * combined position is a win for the first player.
 */
int main(void) {
    int k = 0;
    if (scanf("%d", &k) != 1) {
        return 0;
    }
    if (k < 0) {
        k = 0;
    }

    int *moves = (int *)malloc((size_t)(k > 0 ? k : 1) * sizeof(int));
    if (moves == NULL) {
        return 0;
    }
    for (int i = 0; i < k; ++i) {
        if (scanf("%d", &moves[i]) != 1) {
            free(moves);
            return 0;
        }
    }

    int h = 0;
    if (scanf("%d", &h) != 1) {
        free(moves);
        return 0;
    }
    if (h < 0) {
        h = 0;
    }

    int *heaps = (int *)malloc((size_t)(h > 0 ? h : 1) * sizeof(int));
    if (heaps == NULL) {
        free(moves);
        return 0;
    }
    int max_heap = 0;
    for (int i = 0; i < h; ++i) {
        if (scanf("%d", &heaps[i]) != 1) {
            free(heaps);
            free(moves);
            return 0;
        }
        if (heaps[i] > max_heap) {
            max_heap = heaps[i];
        }
    }

    int *grundy = (int *)calloc((size_t)max_heap + 1, sizeof(int));
    int *seen = (int *)calloc((size_t)k + 2, sizeof(int));
    if (grundy == NULL || seen == NULL) {
        free(grundy);
        free(seen);
        free(heaps);
        free(moves);
        return 0;
    }

    for (int s = 1; s <= max_heap; ++s) {
        for (int i = 0; i < k; ++i) {
            if (moves[i] <= s) {
                /* The stamp s marks a value reachable from this size. */
                seen[grundy[s - moves[i]]] = s;
            }
        }
        int g = 0;
        while (g <= k && seen[g] == s) {
            ++g;
        }
        grundy[s] = g;
    }

    int total = 0;
    for (int i = 0; i < h; ++i) {
        int g = grundy[heaps[i]];
        printf("%d\n", g);
        total ^= g;
    }
    printf("%s\n", total != 0 ? "first" : "second");

    free(grundy);
    free(seen);
    free(heaps);
    free(moves);
    return 0;
}
