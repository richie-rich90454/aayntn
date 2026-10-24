#include <cstdint>
#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

namespace {

constexpr std::uint32_t EMPTY = 0xFFFFFFFFu;

// The modulus is below 2^31, so a product of two residues fits in 64 bits.
std::uint64_t mul_mod(std::uint64_t a, std::uint64_t b, std::uint64_t m) {
    return a * b % m;
}

std::uint64_t pow_mod(std::uint64_t a, std::uint64_t e, std::uint64_t m) {
    std::uint64_t result = 1 % m;
    a %= m;
    while (e > 0) {
        if (e & 1) {
            result = mul_mod(result, a, m);
        }
        a = mul_mod(a, a, m);
        e >>= 1;
    }
    return result;
}

std::int64_t discrete_log(std::uint64_t a, std::uint64_t b, std::uint64_t m) {
    if (b == 1) {
        return 0;
    }

    std::uint64_t n = 1;
    while (n * n < m) {
        ++n;
    }

    std::uint32_t size = 1;
    while (static_cast<std::uint64_t>(size) < 2 * n) {
        size <<= 1;
    }
    const std::uint32_t mask = size - 1;

    std::vector<std::uint32_t> keys(size, EMPTY);
    std::vector<std::uint32_t> values(size, 0);

    // Baby steps: key b * a^q, keeping the largest q for a repeated key.
    std::uint64_t cur = b % m;
    for (std::uint64_t q = 0; q < n; ++q) {
        const std::uint32_t key = static_cast<std::uint32_t>(cur);
        std::uint32_t h = static_cast<std::uint32_t>((static_cast<std::uint64_t>(key) * 40503u) & mask);
        while (keys[h] != EMPTY && keys[h] != key) {
            h = (h + 1) & mask;
        }
        keys[h] = key;
        values[h] = static_cast<std::uint32_t>(q);
        cur = mul_mod(cur, a, m);
    }

    // Giant steps: a^(p * n), matched against the baby-step keys.
    const std::uint64_t stride = pow_mod(a, n, m);
    cur = 1;
    for (std::uint64_t p = 1; p <= n; ++p) {
        cur = mul_mod(cur, stride, m);
        const std::uint32_t key = static_cast<std::uint32_t>(cur);
        std::uint32_t h = static_cast<std::uint32_t>((static_cast<std::uint64_t>(key) * 40503u) & mask);
        while (keys[h] != EMPTY) {
            if (keys[h] == key) {
                return static_cast<std::int64_t>(p * n) - static_cast<std::int64_t>(values[h]);
            }
            h = (h + 1) & mask;
        }
    }

    return -1;
}

}  // namespace

int main() {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long count = 0;
    if (!(std::cin >> count)) {
        return 0;
    }

    for (long long i = 0; i < count; ++i) {
        unsigned long long a = 0;
        unsigned long long b = 0;
        unsigned long long m = 0;
        if (!(std::cin >> a >> b >> m)) {
            break;
        }
        std::cout << discrete_log(a, b, m) << '\n';
    }
    return 0;
}
