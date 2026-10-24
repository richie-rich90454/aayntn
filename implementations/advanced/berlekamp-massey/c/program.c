#include <stdio.h>
#include <stdlib.h>

#define MODULO 1000000007LL

static long long power_mod(long long base, long long exponent) {
    long long result = 1;
    base %= MODULO;
    while (exponent > 0) {
        if (exponent & 1LL) {
            result = result * base % MODULO;
        }
        base = base * base % MODULO;
        exponent >>= 1;
    }
    return result;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    long long *sequence = (long long *)malloc((size_t)n * sizeof *sequence);
    long long *current = (long long *)calloc((size_t)n + 1, sizeof *current);
    long long *backup = (long long *)calloc((size_t)n + 1, sizeof *backup);
    long long *saved = (long long *)calloc((size_t)n + 1, sizeof *saved);
    if (sequence == NULL || current == NULL || backup == NULL || saved == NULL) {
        free(sequence);
        free(current);
        free(backup);
        free(saved);
        return 0;
    }

    for (int i = 0; i < n; ++i) {
        if (scanf("%lld", &sequence[i]) != 1) {
            free(sequence);
            free(current);
            free(backup);
            free(saved);
            return 0;
        }
        sequence[i] %= MODULO;
        if (sequence[i] < 0) {
            sequence[i] += MODULO;
        }
    }

    current[0] = 1;
    backup[0] = 1;
    int current_length = 1;
    int backup_length = 1;
    int order = 0;
    int shift = 1;
    long long last_discrepancy = 1;

    for (int i = 0; i < n; ++i) {
        long long discrepancy = 0;
        int limit = order < i ? order : i;
        for (int j = 0; j <= limit; ++j) {
            discrepancy = (discrepancy + current[j] * sequence[i - j]) % MODULO;
        }
        if (discrepancy == 0) {
            ++shift;
            continue;
        }

        for (int j = 0; j < current_length; ++j) {
            saved[j] = current[j];
        }
        int saved_length = current_length;
        long long coefficient = discrepancy * power_mod(last_discrepancy, MODULO - 2) % MODULO;

        if (current_length < backup_length + shift) {
            for (int j = current_length; j < backup_length + shift; ++j) {
                current[j] = 0;
            }
            current_length = backup_length + shift;
        }
        for (int j = 0; j < backup_length; ++j) {
            current[j + shift] =
                (current[j + shift] - coefficient * backup[j] % MODULO + MODULO) % MODULO;
        }

        if (2 * order <= i) {
            order = i + 1 - order;
            long long *temporary = backup;
            backup = saved;
            saved = temporary;
            backup_length = saved_length;
            last_discrepancy = discrepancy;
            shift = 1;
        } else {
            ++shift;
        }
    }

    long long next_term = 0;
    for (int j = 1; j <= order && j <= n; ++j) {
        next_term = (next_term + current[j] * sequence[n - j]) % MODULO;
    }
    if (next_term != 0) {
        next_term = MODULO - next_term;
    }
    printf("%d %lld\n", order, next_term);

    free(sequence);
    free(current);
    free(backup);
    free(saved);
    return 0;
}
