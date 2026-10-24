#include <stdio.h>
#include <stdlib.h>

#define MOD 1000000007

/*
 * Subset zeta transform.
 *
 * Input: n, then the 2^n values f[0] .. f[2^n - 1], one value per mask.
 * Output: g[0] .. g[2^n - 1], where g[S] is the sum of f[T] over T subset of S,
 * reduced modulo 1000000007.
 *
 * One pass per bit adds the half of the array whose bit is zero to the half
 * whose bit is one. After n passes every entry has collected every submasks.
 */
int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n < 0 || n > 24) {
        return 0;
    }

    const int total = 1 << n;
    int *g = malloc((size_t)total * sizeof *g);
    if (g == NULL) {
        return 0;
    }

    for (int mask = 0; mask < total; mask++) {
        if (scanf("%d", &g[mask]) != 1) {
            g[mask] = 0;
        }
    }

    for (int bit = 0; bit < n; bit++) {
        const int step = 1 << bit;
        for (int base = 0; base < total; base += step << 1) {
            for (int off = 0; off < step; off++) {
                const int source = g[base + off];
                int target = g[base + step + off] + source;
                if (target >= MOD) {
                    target -= MOD;
                }
                g[base + step + off] = target;
            }
        }
    }

    for (int mask = 0; mask < total; mask++) {
        if (mask > 0) {
            putchar(' ');
        }
        printf("%d", g[mask]);
    }
    putchar('\n');

    free(g);
    return 0;
}
