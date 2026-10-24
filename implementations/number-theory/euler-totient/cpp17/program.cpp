#include <iostream>

/*
 * Euler's totient function driver.
 *
 * Reads n, m and a, then prints phi(n) on the first line and a^phi(m) mod m
 * on the second. The exponent is at most m - 1, so every product stays below
 * m * m and a signed 64-bit integer holds it for the stated bounds.
 */

namespace {

long long phi(long long n)
{
    long long result = n;
    long long rest = n;

    for (long long p = 2; p * p <= rest; ++p) {
        if (rest % p == 0) {
            while (rest % p == 0) {
                rest /= p;
            }
            result -= result / p;
        }
    }
    if (rest > 1) {
        result -= result / rest;
    }
    return result;
}

long long mod_pow(long long base, long long exponent, long long modulus)
{
    long long result = 1 % modulus;

    base %= modulus;
    while (exponent > 0) {
        if (exponent & 1) {
            result = result * base % modulus;
        }
        base = base * base % modulus;
        exponent >>= 1;
    }
    return result;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long n, m, a;
    if (!(std::cin >> n >> m >> a)) {
        return 1;
    }

    std::cout << phi(n) << "\n";
    std::cout << mod_pow(a, phi(m), m) << "\n";
    return 0;
}
