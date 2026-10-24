#include <stdio.h>
#include <stdlib.h>

#define BASE 911382323ULL

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }

    unsigned long long *prefix = malloc((size_t)(n + 1) * sizeof *prefix);
    unsigned long long *power = malloc((size_t)(n + 1) * sizeof *power);
    if (prefix == NULL || power == NULL) {
        free(prefix);
        free(power);
        return 1;
    }

    prefix[0] = 0;
    power[0] = 1;
    for (int i = 1; i <= n; i++) {
        long long value;
        if (scanf("%lld", &value) != 1) {
            free(prefix);
            free(power);
            return 1;
        }
        prefix[i] = prefix[i - 1] * BASE + (unsigned long long)value;
        power[i] = power[i - 1] * BASE;
    }

    int q;
    if (scanf("%d", &q) != 1) {
        free(prefix);
        free(power);
        return 1;
    }

    while (q-- > 0) {
        int l1, r1, l2, r2;
        if (scanf("%d %d %d %d", &l1, &r1, &l2, &r2) != 4) {
            break;
        }
        if (r1 - l1 != r2 - l2) {
            puts("NO");
            continue;
        }
        int length = r1 - l1 + 1;
        unsigned long long first = prefix[r1] - prefix[l1 - 1] * power[length];
        unsigned long long second = prefix[r2] - prefix[l2 - 1] * power[length];
        puts(first == second ? "YES" : "NO");
    }

    free(prefix);
    free(power);
    return 0;
}
