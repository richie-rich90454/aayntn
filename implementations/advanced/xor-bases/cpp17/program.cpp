#include <array>
#include <cstdint>
#include <iostream>

namespace {

constexpr int BITS = 30;

}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 0) {
        return 0;
    }

    std::array<std::uint32_t, BITS> basis{};
    for (int k = 0; k < n; ++k) {
        std::uint32_t value = 0;
        if (!(std::cin >> value)) {
            return 0;
        }
        for (int bit = BITS - 1; bit >= 0; --bit) {
            if (((value >> bit) & 1u) == 0) {
                continue;
            }
            if (basis[bit] != 0) {
                value ^= basis[bit];
            } else {
                basis[bit] = value;
                break;
            }
        }
    }

    int q = 0;
    if (!(std::cin >> q) || q < 0) {
        return 0;
    }
    for (int k = 0; k < q; ++k) {
        std::uint32_t x = 0;
        if (!(std::cin >> x)) {
            break;
        }
        for (int bit = BITS - 1; bit >= 0; --bit) {
            if (basis[bit] != 0 && (x ^ basis[bit]) > x) {
                x ^= basis[bit];
            }
        }
        std::cout << x << '\n';
    }
    return 0;
}
