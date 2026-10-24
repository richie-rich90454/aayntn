#include <cstddef>
#include <iostream>
#include <vector>

namespace {

constexpr long long MODULUS = 1000000007LL;

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long n = 0;
    if (!(std::cin >> n) || n < 0) {
        return 0;
    }

    std::vector<int> partitions(static_cast<std::size_t>(n) + 1, 0);
    partitions[0] = 1;

    for (long long i = 1; i <= n; ++i) {
        long long total = 0;
        for (long long k = 1;; ++k) {
            const long long first = k * (3 * k - 1) / 2;
            if (first > i) {
                break;
            }
            const long long second = k * (3 * k + 1) / 2;
            if ((k & 1LL) != 0) {
                total += partitions[i - first];
                if (total >= MODULUS) {
                    total -= MODULUS;
                }
                if (second <= i) {
                    total += partitions[i - second];
                    if (total >= MODULUS) {
                        total -= MODULUS;
                    }
                }
            } else {
                total -= partitions[i - first];
                if (total < 0) {
                    total += MODULUS;
                }
                if (second <= i) {
                    total -= partitions[i - second];
                    if (total < 0) {
                        total += MODULUS;
                    }
                }
            }
        }
        partitions[static_cast<std::size_t>(i)] = static_cast<int>(total);
    }

    std::cout << partitions[static_cast<std::size_t>(n)] << '\n';
    return 0;
}
