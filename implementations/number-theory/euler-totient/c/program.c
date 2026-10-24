#include <stdio.h>
#include <stdlib.h>

/*
 * Euler's totient function driver.
 *
 * Reads n, m and a, then prints phi(n) on the first line and a^phi(m) mod m
 * on the second. The exponent is at most m - 1, so every product stays below
 * m * m and a signed 64-bit integer holds it for the stated bounds.
 */

static long long phi(long long n)
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

static long long mod_pow(long long base, long long exponent, long long modulus)
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

int main(void)
{
    long long n, m, a;

    if (scanf("%lld %lld %lld", &n, &m, &a) != 3) {
        return EXIT_FAILURE;
    }

    printf("%lld\n", phi(n));
    printf("%lld\n", mod_pow(a, phi(m), m));
    return EXIT_SUCCESS;
}
