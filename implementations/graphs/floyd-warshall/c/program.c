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

    const size_t count = (size_t)n * (size_t)n;
    long long *distance = malloc(count * sizeof *distance);
    if (distance == NULL) {
        return 0;
    }
    for (size_t i = 0; i < count; i++) {
        distance[i] = INF;
    }
    for (int v = 0; v < n; v++) {
        distance[(size_t)v * (size_t)n + (size_t)v] = 0;
    }

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
        const size_t at = (size_t)u * (size_t)n + (size_t)v;
        if (w < distance[at]) {
            /* Parallel edges are allowed, and only the cheaper one matters. */
            distance[at] = w;
        }
    }

    for (int k = 0; k < n; k++) {
        const size_t row_k = (size_t)k * (size_t)n;
        for (int i = 0; i < n; i++) {
            const size_t row_i = (size_t)i * (size_t)n;
            const long long through = distance[row_i + (size_t)k];
            if (through == INF) {
                continue;
            }
            for (int j = 0; j < n; j++) {
                const long long rest = distance[row_k + (size_t)j];
                if (rest == INF) {
                    continue;
                }
                const long long candidate = through + rest;
                if (candidate < distance[row_i + (size_t)j]) {
                    distance[row_i + (size_t)j] = candidate;
                }
            }
        }
    }

    for (int v = 0; v < n; v++) {
        if (distance[(size_t)v * (size_t)n + (size_t)v] < 0) {
            printf("negative cycle\n");
            free(distance);
            return 0;
        }
    }

    for (int i = 0; i < n; i++) {
        const size_t row = (size_t)i * (size_t)n;
        for (int j = 0; j < n; j++) {
            if (j > 0) {
                putchar(' ');
            }
            const long long value = distance[row + (size_t)j];
            printf("%lld", value == INF ? -1LL : value);
        }
        putchar('\n');
    }

    free(distance);
    return 0;
}
