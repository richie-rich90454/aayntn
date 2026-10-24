#include <stdio.h>

static int n;
static int full;
static long long count;
static long long nodes;

static void search(int row, int cols, int down, int anti) {
    ++nodes;
    if (row == n) {
        ++count;
        return;
    }
    int available = full & ~(cols | down | anti);
    while (available != 0) {
        int bit = available & -available;
        available ^= bit;
        search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1);
    }
}

int main(void) {
    if (scanf("%d", &n) != 1) {
        return 0;
    }
    full = (1 << n) - 1;
    search(0, 0, 0, 0);
    printf("%lld %lld\n", count, nodes);
    return 0;
}
