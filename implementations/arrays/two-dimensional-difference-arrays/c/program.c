#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int rows, cols;
    if (scanf("%d %d", &rows, &cols) != 2) {
        return 0;
    }

    int stride = cols + 2;
    size_t cells = (size_t)(rows + 2) * (size_t)stride;
    long long *diff = calloc(cells, sizeof(long long));
    if (diff == NULL) {
        return 1;
    }

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            if (scanf("%lld", &diff[(size_t)i * (size_t)stride + (size_t)j]) != 1) {
                free(diff);
                return 1;
            }
        }
    }

    for (int i = 1; i <= rows; i++) {
        long long previous = 0;
        for (int j = 1; j <= cols; j++) {
            size_t index = (size_t)i * (size_t)stride + (size_t)j;
            long long current = diff[index];
            diff[index] = current - previous;
            previous = current;
        }
    }

    for (int j = 1; j <= cols; j++) {
        for (int i = rows; i >= 2; i--) {
            diff[(size_t)i * (size_t)stride + (size_t)j] -=
                diff[(size_t)(i - 1) * (size_t)stride + (size_t)j];
        }
    }

    int queries;
    if (scanf("%d", &queries) != 1) {
        free(diff);
        return 1;
    }

    for (int k = 0; k < queries; k++) {
        int r1, c1, r2, c2;
        long long value;
        if (scanf("%d %d %d %d %lld", &r1, &c1, &r2, &c2, &value) != 5) {
            free(diff);
            return 1;
        }
        diff[(size_t)r1 * (size_t)stride + (size_t)c1] += value;
        diff[(size_t)(r2 + 1) * (size_t)stride + (size_t)c1] -= value;
        diff[(size_t)r1 * (size_t)stride + (size_t)(c2 + 1)] -= value;
        diff[(size_t)(r2 + 1) * (size_t)stride + (size_t)(c2 + 1)] += value;
    }

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            diff[(size_t)i * (size_t)stride + (size_t)j] +=
                diff[(size_t)(i - 1) * (size_t)stride + (size_t)j] +
                diff[(size_t)i * (size_t)stride + (size_t)(j - 1)] -
                diff[(size_t)(i - 1) * (size_t)stride + (size_t)(j - 1)];
        }
    }

    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            printf("%lld%c", diff[(size_t)i * (size_t)stride + (size_t)j],
                   j == cols ? '\n' : ' ');
        }
    }

    free(diff);
    return 0;
}
