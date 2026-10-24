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

static long long binomial(long long n, long long k) {
    long long numerator = 1;
    long long denominator = 1;
    long long i;

    if (k < 0 || k > n) {
        return 0;
    }
    if (k > n - k) {
        k = n - k;
    }
    for (i = 0; i < k; ++i) {
        numerator = numerator * (n - i) % MODULO;
        denominator = denominator * (i + 1) % MODULO;
    }
    return numerator * mod_pow(denominator, MODULO - 2) % MODULO;
}

int main(void) {
    long long n;
    long long total;
    long long bad;
    long long answer;

    if (scanf("%lld", &n) != 1) {
        return 0;
    }
    if (n < 0 || n > 1000000) {
        return 0;
    }

    total = binomial(2 * n, n);
    bad = binomial(2 * n, n - 1);
    answer = (total - bad + MODULO) % MODULO;
    printf("%lld\n", answer);
    return 0;
}
