#include <stdio.h>
#include <stdlib.h>

#define ROOT 3

static long long mod_pow(long long a, long long e, long long mod) {
    long long result = 1;
    a %= mod;
    while (e > 0) {
        if ((e & 1) != 0) {
            result = result * a % mod;
        }
        a = a * a % mod;
        e >>= 1;
    }
    return result;
}

static void ntt(long long *a, int n, int invert, long long mod) {
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        while ((j & bit) != 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            long long t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
    }

    for (int len = 2; len <= n; len <<= 1) {
        long long wlen = mod_pow(ROOT, (mod - 1) / len, mod);
        if (invert) {
            wlen = mod_pow(wlen, mod - 2, mod);
        }
        int half = len >> 1;
        for (int start = 0; start < n; start += len) {
            long long w = 1;
            for (int k = 0; k < half; k++) {
                long long u = a[start + k];
                long long v = a[start + k + half] * w % mod;
                a[start + k] = (u + v) % mod;
                a[start + k + half] = (u - v + mod) % mod;
                w = w * wlen % mod;
            }
        }
    }

    if (invert) {
        long long inv_n = mod_pow(n, mod - 2, mod);
        for (int i = 0; i < n; i++) {
            a[i] = a[i] * inv_n % mod;
        }
    }
}

int main(void) {
    int n = 0;
    int m = 0;
    long long mod = 0;
    if (scanf("%d %d %lld", &n, &m, &mod) != 3 || n <= 0 || m <= 0) {
        return 0;
    }

    int total = n + m - 1;
    int size = 1;
    while (size < total) {
        size <<= 1;
    }

    long long *a = (long long *)calloc((size_t)size, sizeof(long long));
    long long *b = (long long *)calloc((size_t)size, sizeof(long long));
    if (a == NULL || b == NULL) {
        free(a);
        free(b);
        return 0;
    }

    for (int i = 0; i < n; i++) {
        if (scanf("%lld", &a[i]) != 1) {
            free(a);
            free(b);
            return 0;
        }
    }
    for (int i = 0; i < m; i++) {
        if (scanf("%lld", &b[i]) != 1) {
            free(a);
            free(b);
            return 0;
        }
    }

    ntt(a, size, 0, mod);
    ntt(b, size, 0, mod);
    for (int i = 0; i < size; i++) {
        a[i] = a[i] * b[i] % mod;
    }
    ntt(a, size, 1, mod);

    for (int i = 0; i < total; i++) {
        printf("%lld%c", a[i], i + 1 == total ? '\n' : ' ');
    }

    free(a);
    free(b);
    return 0;
}
