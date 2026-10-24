#include <iostream>
#include <utility>
#include <vector>

namespace {

/*
 * Deterministic quickselect: the median of the first, middle, and last value
 * is the pivot, and a three-way partition removes every copy of it at once.
 */
int medianOfThree(const std::vector<int>& a, int lo, int mid, int hi) {
    int x = a[lo];
    int y = a[mid];
    int z = a[hi];
    if (x > y) {
        std::swap(x, y);
    }
    if (y > z) {
        std::swap(y, z);
    }
    if (x > y) {
        std::swap(x, y);
    }
    return y;
}

int selectKth(std::vector<int>& a, int k) {
    int lo = 0;
    int hi = static_cast<int>(a.size()) - 1;
    const int target = k - 1;

    while (lo < hi) {
        const int mid = lo + (hi - lo) / 2;
        const int pivot = medianOfThree(a, lo, mid, hi);
        int lt = lo;
        int i = lo;
        int gt = hi;

        while (i <= gt) {
            if (a[i] < pivot) {
                std::swap(a[lt], a[i]);
                ++lt;
                ++i;
            } else if (a[i] > pivot) {
                std::swap(a[i], a[gt]);
                --gt;
            } else {
                ++i;
            }
        }

        if (target < lt) {
            hi = lt - 1;
        } else if (target > gt) {
            lo = gt + 1;
        } else {
            return pivot;
        }
    }

    return a[lo];
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n <= 0) {
        return 0;
    }

    std::vector<int> a(static_cast<std::size_t>(n));
    for (int index = 0; index < n; ++index) {
        if (!(std::cin >> a[index])) {
            return 0;
        }
    }

    int k = 0;
    if (!(std::cin >> k) || k < 1 || k > n) {
        return 0;
    }

    std::cout << selectKth(a, k) << '\n';
    return 0;
}
