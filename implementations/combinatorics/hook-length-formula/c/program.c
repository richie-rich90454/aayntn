#include <stdio.h>
#include <stdlib.h>

/*
 * The hook-length formula: n! divided by the product of the hook lengths
 * of all cells, with the division performed by a Fermat inverse.
 */
#define MODULUS 1000000007LL

static long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= MODULUS;
    while (exponent > 0) {
        if ((exponent & 1LL) != 0) {
            result = result * base % MODULUS;
        }
        base = base * base % MODULUS;
        exponent >>= 1;
    }
    return result;
}

int main(void) {
    int k = 0;
    if (scanf("%d", &k) != 1 || k < 0) {
        return 0;
    }

    int *rows = NULL;
    if (k > 0) {
        rows = malloc((size_t)k * sizeof(int));
        if (rows == NULL) {
            return 0;
        }
    }

    long long n = 0;
    for (int i = 0; i < k; i++) {
        if (scanf("%d", &rows[i]) != 1 || rows[i] < 0) {
            free(rows);
            return 0;
        }
        n += rows[i];
    }

    const int width = (k > 0) ? rows[0] : 0;
    int *heights = NULL;
    if (width > 0) {
        heights = calloc((size_t)width, sizeof(int));
        if (heights == NULL) {
            free(rows);
            return 0;
        }
    }

    for (int i = 0; i < k; i++) {
        for (int j = 0; j < rows[i]; j++) {
            heights[j]++;
        }
    }

    long long numerator = 1;
    for (long long i = 2; i <= n; i++) {
        numerator = numerator * (i % MODULUS) % MODULUS;
    }

    long long denominator = 1;
    for (int i = 0; i < k; i++) {
        for (int j = 0; j < rows[i]; j++) {
            const long long hook = (long long)rows[i] - j + heights[j] - i - 1;
            denominator = denominator * (hook % MODULUS) % MODULUS;
        }
    }

    const long long answer = numerator * mod_pow(denominator, MODULUS - 2) % MODULUS;
    printf("%lld\n", answer);

    free(heights);
    free(rows);
    return 0;
}
