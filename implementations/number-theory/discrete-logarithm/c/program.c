#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

#define EMPTY 0xFFFFFFFFu

/* The modulus is below 2^31, so a product of two residues fits in 64 bits. */
static uint64_t mul_mod(uint64_t a, uint64_t b, uint64_t m)
{
    return a * b % m;
}

static uint64_t pow_mod(uint64_t a, uint64_t e, uint64_t m)
{
    uint64_t result = 1 % m;

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

static int64_t discrete_log(uint64_t a, uint64_t b, uint64_t m)
{
    if (b == 1) {
        return 0;
    }

    uint64_t n = 1;
    while (n * n < m) {
        n++;
    }

    uint32_t size = 1;
    while ((uint64_t)size < 2 * n) {
        size <<= 1;
    }
    uint32_t mask = size - 1;

    uint32_t *keys = (uint32_t *)malloc((size_t)size * sizeof *keys);
    uint32_t *values = (uint32_t *)malloc((size_t)size * sizeof *values);
    if (keys == NULL || values == NULL) {
        free(keys);
        free(values);
        exit(EXIT_FAILURE);
    }
    for (uint32_t i = 0; i < size; i++) {
        keys[i] = EMPTY;
    }

    /* Baby steps: key b * a^q, keeping the largest q for a repeated key. */
    uint64_t cur = b % m;
    for (uint64_t q = 0; q < n; q++) {
        uint32_t key = (uint32_t)cur;
        uint32_t h = (uint32_t)(((uint64_t)key * 40503u) & mask);
        while (keys[h] != EMPTY && keys[h] != key) {
            h = (h + 1) & mask;
        }
        keys[h] = key;
        values[h] = (uint32_t)q;
        cur = mul_mod(cur, a, m);
    }

    /* Giant steps: a^(p * n), matched against the baby-step keys. */
    uint64_t stride = pow_mod(a, n, m);
    cur = 1;
    for (uint64_t p = 1; p <= n; p++) {
        cur = mul_mod(cur, stride, m);
        uint32_t key = (uint32_t)cur;
        uint32_t h = (uint32_t)(((uint64_t)key * 40503u) & mask);
        while (keys[h] != EMPTY) {
            if (keys[h] == key) {
                int64_t answer = (int64_t)(p * n) - (int64_t)values[h];
                free(keys);
                free(values);
                return answer;
            }
            h = (h + 1) & mask;
        }
    }

    free(keys);
    free(values);
    return -1;
}

int main(void)
{
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    long long count = 0;
    if (scanf("%lld", &count) != 1) {
        return 0;
    }

    for (long long i = 0; i < count; i++) {
        unsigned long long a = 0;
        unsigned long long b = 0;
        unsigned long long m = 0;
        if (scanf("%llu %llu %llu", &a, &b, &m) != 3) {
            break;
        }
        printf("%lld\n", (long long)discrete_log(a, b, m));
    }
    return 0;
}
