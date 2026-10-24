#include <stdio.h>

/*
 * The orientation predicate is the sign of the cross product of B - A and
 * C - A. With coordinates of magnitude at most 10^6 every difference is at
 * most 2 * 10^6, every product is at most 4 * 10^12 and the cross product is
 * at most 8 * 10^12, so the arithmetic in long long is exact.
 */

int main(void) {
    long long q = 0;
    if (scanf("%lld", &q) != 1 || q <= 0) {
        return 0;
    }

    for (long long i = 0; i < q; i++) {
        long long ax = 0;
        long long ay = 0;
        long long bx = 0;
        long long by = 0;
        long long cx = 0;
        long long cy = 0;
        if (scanf("%lld %lld %lld %lld %lld %lld",
                  &ax, &ay, &bx, &by, &cx, &cy) != 6) {
            return 0;
        }

        long long ux = bx - ax;
        long long uy = by - ay;
        long long vx = cx - ax;
        long long vy = cy - ay;
        long long d = ux * vy - uy * vx;

        printf("%d\n", d > 0 ? 1 : (d < 0 ? -1 : 0));
    }
    return 0;
}
