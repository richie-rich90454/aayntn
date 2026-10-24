#include <iostream>
#include <vector>

/*
 * Sorted range search driver.
 *
 * Reads n, then n disjoint intervals sorted by left endpoint, then one point.
 * Prints the 0-based index of the interval that contains the point, or -1 when
 * no interval contains it.
 */

namespace {

int locate(const std::vector<long long>& left, const std::vector<long long>& right, long long point)
{
    int lo = 0;
    int hi = static_cast<int>(left.size()) - 1;

    while (lo <= hi) {
        const int mid = lo + (hi - lo) / 2;
        if (point < left[mid]) {
            hi = mid - 1;
        } else if (point > right[mid]) {
            lo = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;

    if (!(std::cin >> n) || n < 0) {
        std::cout << "-1\n";
        return 0;
    }

    std::vector<long long> left(n);
    std::vector<long long> right(n);

    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> left[i] >> right[i])) {
            std::cout << "-1\n";
            return 0;
        }
    }

    long long point;

    if (!(std::cin >> point)) {
        std::cout << "-1\n";
        return 0;
    }

    std::cout << locate(left, right, point) << "\n";
    return 0;
}
