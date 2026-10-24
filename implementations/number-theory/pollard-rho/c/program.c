#include <stdint.h>
#include <stdio.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * Pollard's rho with fixed constants: x_0 = 2 and c = 1, 2, 3, ... .
 * Every returned divisor is checked by the deterministic Miller-Rabin test,
 * so the factorization is exact for every input below 2^63.
 */

static const uint64_t SMALL_PRIMES[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
static const int SMALL_COUNT = (int)(sizeof SMALL_PRIMES / sizeof SMALL_PRIMES[0]);

/* (a * b) mod m. The product needs 128 bits before it is reduced. */
static uint64_t mul_mod(uint64_t a, uint64_t b, uint64_t m) {
    return (uint64_t)((unsigned __int128)a * b % m);
}

static uint64_t gcd_u64(uint64_t a, uint64_t b) {
    while (b != 0) {
        uint64_t r = a % b;
        a = b;
        b = r;
    }
    return a;
}

static uint64_t pow_mod(uint64_t a, uint64_t e, uint64_t m) {
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

static int is_prime(uint64_t n) {
    if (n < 2) {
        return 0;
    }

    for (int i = 0; i < SMALL_COUNT; i++) {
        uint64_t p = SMALL_PRIMES[i];
        if (n % p == 0) {
            return n == p;
        }
    }

    uint64_t d = n - 1;
    int s = 0;
    while ((d & 1) == 0) {
        d >>= 1;
        s++;
    }

    for (int i = 0; i < SMALL_COUNT; i++) {
        uint64_t x = pow_mod(SMALL_PRIMES[i], d, n);
        if (x == 1 || x == n - 1) {
            continue;
        }
        int passed = 0;
        for (int r = 1; r < s; r++) {
            x = mul_mod(x, x, n);
            if (x == n - 1) {
                passed = 1;
                break;
            }
        }
        if (!passed) {
            return 0;
        }
    }
    return 1;
}

/* One step of f(x) = x^2 + c modulo n, with c already reduced. */
static uint64_t rho_step(uint64_t x, uint64_t c, uint64_t n) {
    uint64_t square = mul_mod(x, x, n);
    uint64_t add = c % n;
    return square >= n - add ? square - (n - add) : square + add;
}

static uint64_t pollard(uint64_t n) {
    if (n % 2 == 0) {
        return 2;
    }
    if (n % 3 == 0) {
        return 3;
    }

    uint64_t c = 1;
    for (;;) {
        uint64_t x = 2;
        uint64_t y = 2;
        uint64_t d = 1;
        while (d == 1) {
            x = rho_step(x, c, n);
            y = rho_step(rho_step(y, c, n), c, n);
            uint64_t diff = x >= y ? x - y : y - x;
            d = gcd_u64(diff, n);
        }
        if (d != n) {
            return d;
        }
        c++;
    }
}

static void factorize(uint64_t n, uint64_t *factors, int *count) {
    uint64_t stack[128];
    int top = 0;
    *count = 0;

    if (n < 2) {
        return;
    }

    for (int i = 0; i < SMALL_COUNT; i++) {
        uint64_t p = SMALL_PRIMES[i];
        while (n % p == 0) {
            factors[(*count)++] = p;
            n /= p;
        }
    }

    if (n > 1) {
        stack[top++] = n;
    }

    while (top > 0) {
        uint64_t m = stack[--top];
        if (is_prime(m)) {
            factors[(*count)++] = m;
        } else {
            uint64_t d = pollard(m);
            stack[top++] = d;
            stack[top++] = m / d;
        }
    }

    for (int i = 1; i < *count; i++) {
        uint64_t value = factors[i];
        int j = i - 1;
        while (j >= 0 && factors[j] > value) {
            factors[j + 1] = factors[j];
            j--;
        }
        factors[j + 1] = value;
    }
}

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int count = 0;
    if (scanf("%d", &count) != 1) {
        return 0;
    }

    for (int i = 0; i < count; i++) {
        unsigned long long value = 0;
        if (scanf("%llu", &value) != 1) {
            break;
        }

        uint64_t factors[128];
        int factor_count = 0;
        factorize((uint64_t)value, factors, &factor_count);

        for (int j = 0; j < factor_count; j++) {
            if (j > 0) {
                putchar(' ');
            }
            printf("%llu", (unsigned long long)factors[j]);
        }
        putchar('\n');
    }
    return 0;
}
