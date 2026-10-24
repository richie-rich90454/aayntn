#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define WORD_BITS 32

static uint32_t *reachable = NULL;

static int popcount32(uint32_t value) {
    return __builtin_popcount(value);
}

int main(void) {
    int n = 0;
    long long limit = 0;
    if (scanf("%d %lld", &n, &limit) != 2) {
        return 0;
    }

    /* One word per 32 sums, plus one for the partial top word. */
    int words = (int)(limit / WORD_BITS) + 1;
    int top_bits = (int)(limit % WORD_BITS) + 1;

    reachable = calloc((size_t)words, sizeof(uint32_t));
    if (reachable == NULL) {
        return 1;
    }
    reachable[0] = 1u; /* the empty subset reaches 0 */

    for (int k = 0; k < n; ++k) {
        long long weight = 0;
        if (scanf("%lld", &weight) != 1) {
            break;
        }
        if (weight <= 0 || weight > limit) {
            continue; /* zero changes nothing; above the limit it cannot fit */
        }

        int word_shift = (int)(weight / WORD_BITS);
        int bit_shift = (int)(weight % WORD_BITS);

        /* Descending: every source word still holds its value from before this weight. */
        for (int i = words - 1; i >= word_shift; --i) {
            uint32_t moved = reachable[i - word_shift] << bit_shift;
            if (bit_shift > 0 && i - word_shift - 1 >= 0) {
                moved |= reachable[i - word_shift - 1] >> (WORD_BITS - bit_shift);
            }
            reachable[i] |= moved;
        }

        if (top_bits < WORD_BITS) {
            reachable[words - 1] &= (1u << top_bits) - 1u;
        }
    }

    long long answer = 0;
    for (int i = 0; i < words; ++i) {
        answer += popcount32(reachable[i]);
    }
    printf("%lld\n", answer);

    free(reachable);
    return 0;
}
