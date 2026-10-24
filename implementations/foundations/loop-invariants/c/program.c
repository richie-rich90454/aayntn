#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 0) {
        return 0;
    }

    long long *a = NULL;
    if (n > 0) {
        a = (long long *)malloc((size_t)n * sizeof(long long));
        if (a == NULL) {
            return 0;
        }
        for (int i = 0; i < n; i++) {
            if (scanf("%lld", &a[i]) != 1) {
                free(a);
                return 0;
            }
        }
    }

    long long target = 0;
    if (scanf("%lld", &target) != 1) {
        free(a);
        return 0;
    }

    int lo = 0;
    int hi = n;
    int probes = 0;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        probes++;
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    printf("%d %d\n", lo, probes);
    free(a);
    return 0;
}
