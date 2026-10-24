/*
 * Answers the defining nearest-site query directly; it does not build the
 * full Voronoi diagram.
 */
#include <iostream>
#include <vector>

struct Point {
    long long x;
    long long y;
};

long long squared_distance(const Point &a, const Point &b) {
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    return dx * dx + dy * dy;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    int q;
    if (!(std::cin >> n >> q) || n <= 0) {
        return 0;
    }

    std::vector<Point> sites(n);
    for (Point &p : sites) {
        std::cin >> p.x >> p.y;
    }

    for (int k = 0; k < q; k++) {
        Point query;
        if (!(std::cin >> query.x >> query.y)) {
            break;
        }

        long long best = 0;
        int best_index = -1;
        for (int i = 0; i < n; i++) {
            long long d = squared_distance(sites[i], query);
            if (best_index < 0 || d < best || (d == best && i < best_index)) {
                best = d;
                best_index = i;
            }
        }
        std::cout << best_index + 1 << '\n';
    }

    return 0;
}
