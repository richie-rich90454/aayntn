#include <stdio.h>
#include <stdlib.h>

/*
 * Euler's recurrence: p(i) is built from the earlier values at the
 * generalized pentagonal offsets, with the sign + for odd k and - for even k.
 */
#define MODULUS 1000000007LL

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1 || n < 0) {
        return 0;
    }

    int *partitions = calloc((size_t)n + 1, sizeof(int));
    if (partitions == NULL) {
        return 0;
    }

    partitions[0] = 1;
    for (long long i = 1; i <= n; i++) {
        long long total = 0;
        for (long long k = 1;; k++) {
            const long long first = k * (3 * k - 1) / 2;
            if (first > i) {
                break;
            }
            const long long second = k * (3 * k + 1) / 2;
            if ((k & 1LL) != 0) {
                total += partitions[i - first];
                if (total >= MODULUS) {
                    total -= MODULUS;
                }
                if (second <= i) {
                    total += partitions[i - second];
                    if (total >= MODULUS) {
                        total -= MODULUS;
                    }
                }
            } else {
                total -= partitions[i - first];
                if (total < 0) {
                    total += MODULUS;
                }
                if (second <= i) {
                    total -= partitions[i - second];
                    if (total < 0) {
                        total += MODULUS;
                    }
                }
            }
        }
        partitions[i] = (int)total;
    }

    printf("%d\n", partitions[n]);
    free(partitions);
    return 0;
}
