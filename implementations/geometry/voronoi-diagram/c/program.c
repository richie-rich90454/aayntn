/*
 * Answers the defining nearest-site query directly; it does not build the
 * full Voronoi diagram.
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long x;
    long long y;
} point;

static long long squared_distance(const point *a, const point *b) {
    long long dx = a->x - b->x;
    long long dy = a->y - b->y;
    return dx * dx + dy * dy;
}

int main(void) {
    int n;
    int q;
    if (scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    point *sites = malloc((size_t)n * sizeof *sites);
    if (sites == NULL) {
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld %lld", &sites[i].x, &sites[i].y) != 2) {
            free(sites);
            return 0;
        }
    }

    for (int k = 0; k < q; k++) {
        point query;
        if (scanf("%lld %lld", &query.x, &query.y) != 2) {
            break;
        }

        long long best = 0;
        int best_index = -1;
        for (int i = 0; i < n; i++) {
            long long d = squared_distance(&sites[i], &query);
            if (best_index < 0 || d < best || (d == best && i < best_index)) {
                best = d;
                best_index = i;
            }
        }
        printf("%d\n", best_index + 1);
    }

    free(sites);
    return 0;
}
