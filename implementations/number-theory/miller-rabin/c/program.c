#include <stdint.h>
#include <stdio.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * The twelve prime bases are deterministic for every n below
 * 3.3 * 10^24, which covers the whole signed 64-bit range.
 */
static const int BASES[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
static const int BASE_COUNT = (int)(sizeof BASES / sizeof BASES[0]);

/* (a * b) mod m: the product needs 128 bits before it is reduced. */
static uint64_t mul_mod(uint64_t a, uint64_t b, uint64_t m) {
    return (uint64_t)((unsigned __int128)a * b % m);
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

    /* Small factors are cheap, and they leave n > 37 and coprime to every base. */
    for (int i = 0; i < BASE_COUNT; i++) {
        const uint64_t p = (uint64_t)BASES[i];
        if (n % p == 0) {
            return n == p;
        }
    }

    /* Write n - 1 as 2^s * d with d odd. */
    uint64_t d = n - 1;
    int s = 0;
    while ((d & 1) == 0) {
        d >>= 1;
        s++;
    }

    for (int i = 0; i < BASE_COUNT; i++) {
        uint64_t x = pow_mod((uint64_t)BASES[i], d, n);
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

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    long long count = 0;
    if (scanf("%lld", &count) != 1) {
        return 0;
    }

    for (long long i = 0; i < count; i++) {
        long long value = 0;
        if (scanf("%lld", &value) != 1) {
            break;
        }
        if (value < 2) {
            puts("COMPOSITE");
        } else {
            puts(is_prime((uint64_t)value) ? "PRIME" : "COMPOSITE");
        }
    }
    return 0;
}
