#include <cstdint>
#include <iostream>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 1 || n > 20) {
        return 0;
    }

    const std::uint32_t total = 1u << n;
    for (std::uint32_t i = 0; i < total; ++i) {
        const std::uint32_t gray = i ^ (i >> 1);
        for (int bit = n - 1; bit >= 0; --bit) {
            std::cout << ((gray >> bit) & 1u);
        }
        std::cout << '\n';
    }
    return 0;
}
