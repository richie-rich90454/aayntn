#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Count the tilings of an r x c grid with 1 x 2 and 2 x 1 dominoes.
 *
 * Input: r c, then r strings of c characters. '0' is a free cell and '1' is
 * blocked.
 * Output: the number of ways to cover every free cell exactly once.
 *
 * Before cell k the mask describes the next c cells: bit d is 1 when cell
 * k + d is already covered by a domino placed earlier. Bit 0 is cell k.
 */
int main(void) {
    int r = 0;
    int c = 0;
    if (scanf("%d %d", &r, &c) != 2) {
        return 0;
    }
    if (r <= 0 || c <= 0) {
        printf("1\n");
        return 0;
    }

    const int cells = r * c;
    const int size = 1 << c;
    unsigned char *grid = malloc((size_t)cells);
    long long *dp = calloc((size_t)size, sizeof *dp);
    long long *next = calloc((size_t)size, sizeof *next);
    char row[32] = {0};
    if (grid == NULL || dp == NULL || next == NULL) {
        free(grid);
        free(dp);
        free(next);
        return 0;
    }

    for (int i = 0; i < r; i++) {
        if (scanf("%31s", row) != 1) {
            row[0] = '\0';
        }
        for (int j = 0; j < c; j++) {
            grid[i * c + j] = (unsigned char)(row[j] == '1');
        }
    }

    dp[0] = 1;
    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            const int k = i * c + j;
            memset(next, 0, (size_t)size * sizeof *next);
            for (int mask = 0; mask < size; mask++) {
                const long long ways = dp[mask];
                if (ways == 0) {
                    continue;
                }
                const int base = mask >> 1;

                if (grid[k] != 0) {
                    /* A blocked cell may only pass through when no earlier
                       domino has already claimed it. */
                    if ((mask & 1) == 0) {
                        next[base] += ways;
                    }
                } else if ((mask & 1) != 0) {
                    /* The current cell was covered by a domino placed before
                       it; the mask only has to slide. */
                    next[base] += ways;
                } else {
                    /* Place a horizontal domino over this cell and the next. */
                    if (j + 1 < c && grid[k + 1] == 0 && (mask & 2) == 0) {
                        next[base | 1] += ways;
                    }
                    /* Place a vertical domino over this cell and the one
                       directly below it. */
                    if (i + 1 < r && grid[k + c] == 0) {
                        next[base | (1 << (c - 1))] += ways;
                    }
                }
            }

            long long *swap = dp;
            dp = next;
            next = swap;
        }
    }

    printf("%lld\n", dp[0]);
    free(grid);
    free(dp);
    free(next);
    return 0;
}
