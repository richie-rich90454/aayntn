#include <stdint.h>
#include <stdio.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    if (n < 1 || n > 20) {
        return 0;
    }

    const uint32_t total = 1u << n;
    for (uint32_t i = 0; i < total; ++i) {
        const uint32_t gray = i ^ (i >> 1);
        for (int bit = n - 1; bit >= 0; --bit) {
            putchar(((gray >> bit) & 1u) ? '1' : '0');
        }
        putchar('\n');
    }
    return 0;
}
