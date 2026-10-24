#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 0) {
        return 0;
    }

    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> a[i])) {
            return 0;
        }
    }

    long long target = 0;
    if (!(std::cin >> target)) {
        return 0;
    }

    int lo = 0;
    int hi = n;
    int probes = 0;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        ++probes;
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    std::cout << lo << ' ' << probes << '\n';
    return 0;
}
