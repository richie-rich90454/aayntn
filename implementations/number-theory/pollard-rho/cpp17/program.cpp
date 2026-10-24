#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * Pollard's rho with fixed constants: x_0 = 2 and c = 1, 2, 3, ... .
 * Every returned divisor is checked by the deterministic Miller-Rabin test,
 * so the factorization is exact for every input below 2^63.
 */

namespace {

using u64 = std::uint64_t;

constexpr u64 SMALL_PRIMES[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};

u64 mul_mod(u64 a, u64 b, u64 m) {
    return static_cast<u64>(static_cast<unsigned __int128>(a) * b % m);
}

u64 gcd_u64(u64 a, u64 b) {
    while (b != 0) {
        u64 r = a % b;
        a = b;
        b = r;
    }
    return a;
}

u64 pow_mod(u64 a, u64 e, u64 m) {
    u64 result = 1 % m;
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

bool is_prime(u64 n) {
    if (n < 2) {
        return false;
    }

    for (u64 p : SMALL_PRIMES) {
        if (n % p == 0) {
            return n == p;
        }
    }

    u64 d = n - 1;
    int s = 0;
    while ((d & 1) == 0) {
        d >>= 1;
        s++;
    }

    for (u64 base : SMALL_PRIMES) {
        u64 x = pow_mod(base, d, n);
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

u64 rho_step(u64 x, u64 c, u64 n) {
    u64 square = mul_mod(x, x, n);
    u64 add = c % n;
    return square >= n - add ? square - (n - add) : square + add;
}

u64 pollard(u64 n) {
    if (n % 2 == 0) {
        return 2;
    }
    if (n % 3 == 0) {
        return 3;
    }

    u64 c = 1;
    for (;;) {
        u64 x = 2;
        u64 y = 2;
        u64 d = 1;
        while (d == 1) {
            x = rho_step(x, c, n);
            y = rho_step(rho_step(y, c, n), c, n);
            u64 diff = x >= y ? x - y : y - x;
            d = gcd_u64(diff, n);
        }
        if (d != n) {
            return d;
        }
        c++;
    }
}

void factorize(u64 n, std::vector<u64> &factors) {
    if (n < 2) {
        return;
    }

    for (u64 p : SMALL_PRIMES) {
        while (n % p == 0) {
            factors.push_back(p);
            n /= p;
        }
    }

    std::vector<u64> stack;
    if (n > 1) {
        stack.push_back(n);
    }

    while (!stack.empty()) {
        u64 m = stack.back();
        stack.pop_back();
        if (is_prime(m)) {
            factors.push_back(m);
        } else {
            u64 d = pollard(m);
            stack.push_back(d);
            stack.push_back(m / d);
        }
    }

    std::sort(factors.begin(), factors.end());
}

}  // namespace

int main() {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int count = 0;
    if (!(std::cin >> count)) {
        return 0;
    }

    for (int i = 0; i < count; i++) {
        u64 value = 0;
        if (!(std::cin >> value)) {
            break;
        }

        std::vector<u64> factors;
        factorize(value, factors);

        for (std::size_t j = 0; j < factors.size(); j++) {
            if (j > 0) {
                std::cout << ' ';
            }
            std::cout << factors[j];
        }
        std::cout << '\n';
    }
    return 0;
}
