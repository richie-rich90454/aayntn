#include <stdio.h>
#include <stdlib.h>

/*
 * A lattice polygon has three exact integer quantities: twice its area, the
 * number of lattice points on its boundary, and the number of lattice points
 * strictly inside it. The shoelace sum gives the first, a gcd per edge gives
 * the second, and Pick's theorem gives the third.
 */

static long long gcd_abs(long long a, long long b) {
    if (a < 0) {
        a = -a;
    }
    if (b < 0) {
        b = -b;
    }
    while (b != 0) {
        long long remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1 || n < 3) {
        return 0;
    }

    long long *xs = malloc((size_t)n * sizeof(*xs));
    long long *ys = malloc((size_t)n * sizeof(*ys));
    if (xs == NULL || ys == NULL) {
        free(xs);
        free(ys);
        return 0;
    }

    for (long long i = 0; i < n; i++) {
        if (scanf("%lld %lld", &xs[i], &ys[i]) != 2) {
            free(xs);
            free(ys);
            return 0;
        }
    }

    long long twice_area = 0;
    long long boundary = 0;
    for (long long i = 0; i < n; i++) {
        long long j = (i + 1) % n;
        twice_area += xs[i] * ys[j] - xs[j] * ys[i];
        boundary += gcd_abs(xs[j] - xs[i], ys[j] - ys[i]);
    }

    if (twice_area < 0) {
        twice_area = -twice_area;
    }
    long long interior = (twice_area - boundary + 2) / 2;

    printf("%lld\n%lld\n%lld\n", twice_area, boundary, interior);
    free(xs);
    free(ys);
    return 0;
}
