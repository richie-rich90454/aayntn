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

std::int64_t EulerPhi(std::int64_t x) {
    std::int64_t result = x;
    std::int64_t remaining = x;
    for (std::int64_t p = 2; p * p <= remaining; p += (p == 2) ? 1 : 2) {
        if (remaining % p != 0) {
            continue;
        }
        while (remaining % p == 0) {
            remaining /= p;
        }
        result -= result / p;
    }
    if (remaining > 1) {
        result -= result / remaining;
    }
    return result;
}

std::int64_t Term(std::int64_t d, std::int64_t n, std::int64_t k) {
    return EulerPhi(d) * ModPow(k, n / d) % kModulo;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::int64_t n = 0;
    std::int64_t k = 0;
    if (!(std::cin >> n >> k)) {
        return 0;
    }
    if (n < 1 || n > 1000000 || k < 1 || k > 1000000000) {
        return 0;
    }

    std::int64_t sum = 0;
    for (std::int64_t i = 1; i * i <= n; ++i) {
        if (n % i != 0) {
            continue;
        }
        sum = (sum + Term(i, n, k)) % kModulo;
        if (i != n / i) {
            sum = (sum + Term(n / i, n, k)) % kModulo;
        }
    }

    sum = sum * ModPow(n, kModulo - 2) % kModulo;
    std::cout << sum << '\n';
    return 0;
}
