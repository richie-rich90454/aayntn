#include <cstdint>
#include <iostream>

namespace {

constexpr std::int64_t kModulo = 1000000007;

std::int64_t ModPow(std::int64_t base, std::int64_t exponent) {
    std::int64_t result = 1;
    base %= kModulo;
    while (exponent > 0) {
        if ((exponent & 1) == 1) {
            result = result * base % kModulo;
        }
        base = base * base % kModulo;
        exponent >>= 1;
    }
    return result;
}

std::int64_t Binomial(std::int64_t n, std::int64_t k) {
    if (k < 0 || k > n) {
        return 0;
    }
    if (k > n - k) {
        k = n - k;
    }
    std::int64_t numerator = 1;
    std::int64_t denominator = 1;
    for (std::int64_t i = 0; i < k; ++i) {
        numerator = numerator * (n - i) % kModulo;
        denominator = denominator * (i + 1) % kModulo;
    }
    return numerator * ModPow(denominator, kModulo - 2) % kModulo;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::int64_t n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0 || n > 1000000) {
        return 0;
    }

    const std::int64_t total = Binomial(2 * n, n);
    const std::int64_t bad = Binomial(2 * n, n - 1);
    std::cout << (total - bad + kModulo) % kModulo << '\n';
    return 0;
}
