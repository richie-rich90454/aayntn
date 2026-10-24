#include <iostream>

/*
 * The orientation predicate is the sign of the cross product of B - A and
 * C - A. With coordinates of magnitude at most 10^6 every difference is at
 * most 2 * 10^6, every product is at most 4 * 10^12 and the cross product is
 * at most 8 * 10^12, so the arithmetic in long long is exact.
 */

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int q = 0;
    if (!(std::cin >> q) || q <= 0) {
        return 0;
    }

    for (int i = 0; i < q; i++) {
        long long ax = 0;
        long long ay = 0;
        long long bx = 0;
        long long by = 0;
        long long cx = 0;
        long long cy = 0;
        if (!(std::cin >> ax >> ay >> bx >> by >> cx >> cy)) {
            return 0;
        }

        const long long ux = bx - ax;
        const long long uy = by - ay;
        const long long vx = cx - ax;
        const long long vy = cy - ay;
        const long long d = ux * vy - uy * vx;

        std::cout << (d > 0 ? 1 : (d < 0 ? -1 : 0)) << '\n';
    }
    return 0;
}
