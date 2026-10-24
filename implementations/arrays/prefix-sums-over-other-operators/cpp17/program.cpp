#include <iostream>
#include <vector>

/*
 * Prefix products over a static array.
 *
 * Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints the product of each range modulo 1000000007.
 * The prefix table stores 1 in place of a zero, and a separate prefix table
 * counts the zeros, so a range is either zero or a quotient of two nonzero
 * prefix products.
 */

namespace {

constexpr long long kModulo = 1000000007LL;

long long mod_power(long long base, long long exponent)
{
    long long result = 1;
    base %= kModulo;
    while (exponent > 0) {
        if ((exponent & 1LL) != 0) {
            result = result * base % kModulo;
        }
        base = base * base % kModulo;
        exponent >>= 1;
    }
    return result;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    std::vector<long long> value(n + 1, 0);
    std::vector<long long> product(n + 1, 1);
    std::vector<long long> inverse(n + 1, 1);
    std::vector<long long> zeros(n + 1, 0);

    for (int i = 1; i <= n; ++i) {
        long long x = 0;
        std::cin >> x;
        x %= kModulo;
        if (x < 0) {
            x += kModulo;
        }
        value[i] = x;
        zeros[i] = zeros[i - 1] + (x == 0 ? 1 : 0);
        product[i] = product[i - 1] * (x == 0 ? 1 : x) % kModulo;
    }

    inverse[n] = mod_power(product[n], kModulo - 2);
    for (int i = n; i >= 1; --i) {
        const long long factor = value[i] == 0 ? 1 : value[i];
        inverse[i - 1] = inverse[i] * factor % kModulo;
    }

    int q = 0;
    if (!(std::cin >> q)) {
        return 0;
    }
    for (int j = 0; j < q; ++j) {
        int l = 0;
        int r = 0;
        std::cin >> l >> r;
        if (zeros[r] - zeros[l - 1] > 0) {
            std::cout << 0 << '\n';
        } else {
            std::cout << product[r] * inverse[l - 1] % kModulo << '\n';
        }
    }
    return 0;
}
