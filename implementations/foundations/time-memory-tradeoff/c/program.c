#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 1) {
        return 0;
    }

    int block = 1;
    while ((long long)(block + 1) * (block + 1) <= (long long)n) {
        block++;
    }
    int blocks = (n + block - 1) / block;

    long long *inside = (long long *)malloc((size_t)(n + 1) * sizeof(long long));
    long long *base = (long long *)malloc((size_t)(blocks + 1) * sizeof(long long));
    if (inside == NULL || base == NULL) {
        free(inside);
        free(base);
        return 0;
    }

    for (int i = 1; i <= n; i++) {
        if (scanf("%lld", &inside[i]) != 1) {
            inside[i] = 0;
        }
    }

    long long total = 0;
    for (int b = 0; b < blocks; b++) {
        base[b] = total;
        long long run = 0;
        int start = b * block + 1;
        int end = start + block - 1;
        if (end > n) {
            end = n;
        }
        for (int i = start; i <= end; i++) {
            run += inside[i];
            inside[i] = run;
        }
        total += run;
    }
    base[blocks] = total;

    int q = 0;
    if (scanf("%d", &q) != 1) {
        q = 0;
    }
    for (int k = 0; k < q; k++) {
        int l = 1;
        int r = 0;
        if (scanf("%d %d", &l, &r) != 2) {
            break;
        }
        long long prefix_right;
        if (r == 0) {
            prefix_right = 0;
        } else {
            prefix_right = base[(r - 1) / block] + inside[r];
        }
        long long prefix_left;
        int before = l - 1;
        if (before == 0) {
            prefix_left = 0;
        } else {
            prefix_left = base[(before - 1) / block] + inside[before];
        }
        printf("%lld\n", prefix_right - prefix_left);
    }

    free(inside);
    free(base);
    return 0;
}
