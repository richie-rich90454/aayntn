#include <stdio.h>

/*
 * XOR basis over 30 bits. The value below 2^30 keeps the sign bit clear, so
 * unsigned arithmetic and the printed result agree on every input.
 */
#define BITS 30

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 0) {
        return 0;
    }

    unsigned int basis[BITS] = {0};
    for (int k = 0; k < n; k++) {
        unsigned int value = 0;
        if (scanf("%u", &value) != 1) {
            return 0;
        }
        for (int bit = BITS - 1; bit >= 0; bit--) {
            if (((value >> bit) & 1u) == 0) {
                continue;
            }
            if (basis[bit] != 0) {
                value ^= basis[bit];
            } else {
                basis[bit] = value;
                break;
            }
        }
    }

    int q = 0;
    if (scanf("%d", &q) != 1 || q < 0) {
        return 0;
    }
    for (int k = 0; k < q; k++) {
        unsigned int x = 0;
        if (scanf("%u", &x) != 1) {
            break;
        }
        for (int bit = BITS - 1; bit >= 0; bit--) {
            if (basis[bit] != 0 && (x ^ basis[bit]) > x) {
                x ^= basis[bit];
            }
        }
        printf("%u\n", x);
    }
    return 0;
}
