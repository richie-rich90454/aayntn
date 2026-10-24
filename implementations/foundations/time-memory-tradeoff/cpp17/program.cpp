#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 1) {
        return 0;
    }

    int block = 1;
    while (static_cast<long long>(block + 1) * (block + 1) <= n) {
        ++block;
    }
    const int blocks = (n + block - 1) / block;

    std::vector<long long> inside(n + 1, 0);
    std::vector<long long> base(blocks + 1, 0);

    for (int i = 1; i <= n; ++i) {
        std::cin >> inside[i];
    }

    long long total = 0;
    for (int b = 0; b < blocks; ++b) {
        base[b] = total;
        long long run = 0;
        const int start = b * block + 1;
        const int end = std::min(n, start + block - 1);
        for (int i = start; i <= end; ++i) {
            run += inside[i];
            inside[i] = run;
        }
        total += run;
    }
    base[blocks] = total;

    const auto prefix = [&](int i) -> long long {
        if (i == 0) {
            return 0;
        }
        return base[(i - 1) / block] + inside[i];
    };

    int q = 0;
    if (!(std::cin >> q)) {
        return 0;
    }
    for (int k = 0; k < q; ++k) {
        int l = 1;
        int r = 0;
        if (!(std::cin >> l >> r)) {
            break;
        }
        std::cout << prefix(r) - prefix(l - 1) << '\n';
    }
    return 0;
}
