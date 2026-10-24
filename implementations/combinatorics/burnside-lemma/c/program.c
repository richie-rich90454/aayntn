#include <stdio.h>

#define MODULO 1000000007LL

static long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= MODULO;
    while (exponent > 0) {
        if ((exponent & 1LL) == 1LL) {
            result = result * base % MODULO;
        }
        base = base * base % MODULO;
        exponent >>= 1;
    }
    return result;
}

static long long euler_phi(long long x) {
    long long result = x;
    long long remaining = x;
    long long p = 2;

    while (p * p <= remaining) {
        if (remaining % p == 0) {
            while (remaining % p == 0) {
                remaining /= p;
            }
            result -= result / p;
        }
        p += (p == 2) ? 1 : 2;
    }
    if (remaining > 1) {
        result -= result / remaining;
    }
    return result;
}

static long long term(long long d, long long n, long long k) {
    return euler_phi(d) * mod_pow(k, n / d) % MODULO;
}

int main(void) {
    long long n;
    long long k;
    long long sum = 0;
    long long i;

    if (scanf("%lld %lld", &n, &k) != 2) {
        return 0;
    }
    if (n < 1 || n > 1000000 || k < 1 || k > 1000000000LL) {
        return 0;
    }

    for (i = 1; i * i <= n; ++i) {
        if (n % i != 0) {
            continue;
        }
        sum = (sum + term(i, n, k)) % MODULO;
        if (i != n / i) {
            sum = (sum + term(n / i, n, k)) % MODULO;
        }
    }

    sum = sum * mod_pow(n, MODULO - 2) % MODULO;
    printf("%lld\n", sum);
    return 0;
}
