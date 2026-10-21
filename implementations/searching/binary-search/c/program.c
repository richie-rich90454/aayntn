#include <stdio.h>
#include <stdlib.h>

/*
 * Binary search driver.
 *
 * Reads n, a sorted run of integers and a target from standard input, then
 * prints the 0-based index of the target, or -1 when it is absent.
 */

static long long binary_search(const long long *a, int n, long long target)
{
    int lo = 0;
    int hi = n - 1;

    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) {
            return mid;
        }
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return -1;
}

/* Reads every integer on standard input into a heap buffer. */
static long long *read_all_values(int *count)
{
    int capacity = 16;
    int size = 0;
    long long *values = malloc(sizeof *values * (size_t)capacity);

    if (values == NULL) {
        return NULL;
    }

    long long value;
    while (scanf("%lld", &value) == 1) {
        if (size == capacity) {
            capacity *= 2;
            long long *grown = realloc(values, sizeof *values * (size_t)capacity);
            if (grown == NULL) {
                free(values);
                return NULL;
            }
            values = grown;
        }
        values[size++] = value;
    }

    *count = size;
    return values;
}

int main(void)
{
    int count = 0;
    long long *values = read_all_values(&count);

    if (values == NULL) {
        return EXIT_FAILURE;
    }

    /*
     * The target is the final token and the array takes at most n of the
     * tokens before it, so a header that disagrees with the data cannot
     * swallow the target.
     */
    if (count < 2) {
        free(values);
        printf("-1\n");
        return EXIT_SUCCESS;
    }

    long long declared = values[0];
    long long target = values[count - 1];
    long long available = (long long)count - 2;
    long long array_length = declared < available ? declared : available;
    if (array_length < 0) {
        array_length = 0;
    }

    int answer = binary_search(values + 1, (int)array_length, target);
    free(values);
    printf("%d\n", answer);
    return EXIT_SUCCESS;
}
