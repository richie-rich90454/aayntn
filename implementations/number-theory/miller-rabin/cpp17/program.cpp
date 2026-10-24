#include <cstdint>
#include <iostream>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

namespace {

const int BASES[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
const int BASE_COUNT = static_cast<int>(sizeof BASES / sizeof BASES[0]);

// (a * b) mod m: the product needs 128 bits before it is reduced.
std::uint64_t mul_mod(std::uint64_t a, std::uint64_t b, std::uint64_t m) {
    return static_cast<std::uint64_t>(static_cast<unsigned __int128>(a) * b % m);
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

bool is_prime(std::uint64_t n) {
    if (n < 2) {
        return false;
    }

    // Small factors are cheap, and they leave n > 37 and coprime to every base.
    for (int i = 0; i < BASE_COUNT; i++) {
        const std::uint64_t p = static_cast<std::uint64_t>(BASES[i]);
        if (n % p == 0) {
            return n == p;
        }
    }

    // Write n - 1 as 2^s * d with d odd.
    std::uint64_t d = n - 1;
    int s = 0;
    while ((d & 1) == 0) {
        d >>= 1;
        ++s;
    }

    for (int i = 0; i < BASE_COUNT; i++) {
        std::uint64_t x = pow_mod(static_cast<std::uint64_t>(BASES[i]), d, n);
        if (x == 1 || x == n - 1) {
            continue;
        }
        bool passed = false;
        for (int r = 1; r < s; r++) {
            x = mul_mod(x, x, n);
            if (x == n - 1) {
                passed = true;
                break;
            }
        }
        if (!passed) {
            return false;
        }
    }
    return true;
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

    for (long long i = 0; i < count; i++) {
        long long value = 0;
        if (!(std::cin >> value)) {
            break;
        }
        if (value < 2) {
            std::cout << "COMPOSITE\n";
        } else {
            std::cout << (is_prime(static_cast<std::uint64_t>(value)) ? "PRIME\n" : "COMPOSITE\n");
        }
    }
    return 0;
}
