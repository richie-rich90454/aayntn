#include <stdio.h>
#include <stdlib.h>

static int compareInt64(const void *left, const void *right) {
    long long a = *(const long long *)left;
    long long b = *(const long long *)right;
    return (a > b) - (a < b);
}

static int upperBound(const long long *values, int count, long long target) {
    int low = 0;
    int high = count;
    while (low < high) {
        int middle = low + (high - low) / 2;
        if (values[middle] <= target) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

static int buildSums(const long long *values, int from, int to, long long *sums) {
    int size = 1;
    sums[0] = 0;
    for (int i = from; i < to; ++i) {
        for (int j = 0; j < size; ++j) {
            sums[size + j] = sums[j] + values[i];
        }
        size *= 2;
    }
    return size;
}

int main(void) {
    int n;
    long long limit;
    long long values[40];
    static long long left[1 << 20];
    static long long right[1 << 20];

    if (scanf("%d %lld", &n, &limit) != 2) {
        return 0;
    }
    if (n < 0 || n > 40) {
        return 0;
    }
    for (int i = 0; i < n; ++i) {
        if (scanf("%lld", &values[i]) != 1) {
            return 0;
        }
    }

    int middle = n / 2;
    int leftSize = buildSums(values, 0, middle, left);
    int rightSize = buildSums(values, middle, n, right);

    qsort(right, (size_t)rightSize, sizeof(long long), compareInt64);

    long long answer = 0;
    for (int i = 0; i < leftSize; ++i) {
        answer += upperBound(right, rightSize, limit - left[i]);
    }
    printf("%lld\n", answer);
    return 0;
}
