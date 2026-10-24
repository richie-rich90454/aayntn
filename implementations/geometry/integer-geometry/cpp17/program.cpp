#include <cstdlib>
#include <iostream>
#include <numeric>
#include <vector>

namespace {

struct Point {
    long long x;
    long long y;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 3) {
        return 0;
    }

    std::vector<Point> points(static_cast<std::size_t>(n));
    for (Point& point : points) {
        if (!(std::cin >> point.x >> point.y)) {
            return 0;
        }
    }

    long long twice_area = 0;
    long long boundary = 0;
    for (int i = 0; i < n; ++i) {
        const Point& a = points[static_cast<std::size_t>(i)];
        const Point& b = points[static_cast<std::size_t>((i + 1) % n)];
        twice_area += a.x * b.y - b.x * a.y;
        boundary += std::gcd(std::llabs(b.x - a.x), std::llabs(b.y - a.y));
    }

    twice_area = std::llabs(twice_area);
    const long long interior = (twice_area - boundary + 2) / 2;

    std::cout << twice_area << '\n' << boundary << '\n' << interior << '\n';
    return 0;
}
