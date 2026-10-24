#include <stdio.h>
#include <stdlib.h>

/*
 * Prefix products over a static array.
 *
 * Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints the product of each range modulo 1000000007.
 * A range that contains a zero prints 0; every other range is answered from a
 * prefix product of the nonzero values and a backward-built inverse table.
 */

#define MODULO 1000000007LL

static long long mod_power(long long base, long long exponent)
{
    long long result = 1;
    base %= MODULO;
    while (exponent > 0) {
        if ((exponent & 1LL) != 0) {
            result = result * base % MODULO;
        }
        base = base * base % MODULO;
        exponent >>= 1;
    }
    return result;
}

int main(void)
{
    int n = 0;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    size_t size = (size_t)n + 1;
    long long *value = calloc(size, sizeof *value);
    long long *product = calloc(size, sizeof *product);
    long long *inverse = calloc(size, sizeof *inverse);
    long long *zeros = calloc(size, sizeof *zeros);
    if (value == NULL || product == NULL || inverse == NULL || zeros == NULL) {
        free(value);
        free(product);
        free(inverse);
        free(zeros);
        return 0;
    }

    product[0] = 1;
    for (int i = 1; i <= n; i++) {
        long long x = 0;
        if (scanf("%lld", &x) != 1) {
            break;
        }
        x %= MODULO;
        if (x < 0) {
            x += MODULO;
        }
        value[i] = x;
        zeros[i] = zeros[i - 1] + (x == 0 ? 1 : 0);
        product[i] = product[i - 1] * (x == 0 ? 1 : x) % MODULO;
    }

    inverse[n] = mod_power(product[n], MODULO - 2);
    for (int i = n; i >= 1; i--) {
        long long factor = value[i] == 0 ? 1 : value[i];
        inverse[i - 1] = inverse[i] * factor % MODULO;
    }

    int q = 0;
    if (scanf("%d", &q) != 1) {
        q = 0;
    }
    for (int j = 0; j < q; j++) {
        int l = 0;
        int r = 0;
        if (scanf("%d %d", &l, &r) != 2) {
            break;
        }
        if (zeros[r] - zeros[l - 1] > 0) {
            printf("0\n");
        } else {
            printf("%lld\n", product[r] * inverse[l - 1] % MODULO);
        }
    }

    free(value);
    free(product);
    free(inverse);
    free(zeros);
    return 0;
}
