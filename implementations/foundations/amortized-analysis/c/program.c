#include <stdio.h>

int main(void) {
    long long n = 0;
    if (scanf("%lld", &n) != 1) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    long long copies = 0;
    long long capacity = 1;
    while (capacity < n) {
        copies += capacity;
        capacity *= 2;
    }

    printf("%lld %lld\n", copies, capacity);
    return 0;
}
