#include <stdio.h>

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1 || n < 0) {
        return 0;
    }

    long long square = n * n;
    long long total = 0;
    for (long long k = 1; k <= n; ++k) {
        total += 2 * k - 1;
    }

    printf("%lld\n%lld\n%s\n", square, total, square == total ? "MATCH" : "DIFFER");
    return 0;
}
