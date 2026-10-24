#include <iostream>
#include <vector>

namespace {
constexpr unsigned long long BASE = 911382323ULL;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    if (!(std::cin >> n)) {
        return 0;
    }

    std::vector<unsigned long long> prefix(n + 1);
    std::vector<unsigned long long> power(n + 1);
    prefix[0] = 0;
    power[0] = 1;

    for (int i = 1; i <= n; i++) {
        long long value;
        std::cin >> value;
        prefix[i] = prefix[i - 1] * BASE + static_cast<unsigned long long>(value);
        power[i] = power[i - 1] * BASE;
    }

    int q;
    std::cin >> q;
    while (q-- > 0) {
        int l1, r1, l2, r2;
        std::cin >> l1 >> r1 >> l2 >> r2;
        if (r1 - l1 != r2 - l2) {
            std::cout << "NO\n";
            continue;
        }
        int length = r1 - l1 + 1;
        unsigned long long first = prefix[r1] - prefix[l1 - 1] * power[length];
        unsigned long long second = prefix[r2] - prefix[l2 - 1] * power[length];
        std::cout << (first == second ? "YES\n" : "NO\n");
    }

    return 0;
}
