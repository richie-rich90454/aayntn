#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

#define MAX_INTERVALS 12

typedef struct {
    long long start;
    long long end;
} Interval;

static int compare_intervals(const void *left, const void *right) {
    const Interval *a = (const Interval *)left;
    const Interval *b = (const Interval *)right;
    if (a->end < b->end) {
        return -1;
    }
    if (a->end > b->end) {
        return 1;
    }
    if (a->start < b->start) {
        return -1;
    }
    if (a->start > b->start) {
        return 1;
    }
    return 0;
}

static int compatible(const Interval *a, const Interval *b) {
    return a->end <= b->start || b->end <= a->start;
}

int main(void) {
    int n = 0;
    if (scanf("%d", &n) != 1 || n < 0 || n > MAX_INTERVALS) {
        return 0;
    }

    Interval intervals[MAX_INTERVALS];
    Interval sorted[MAX_INTERVALS];
    int i;
    for (i = 0; i < n; ++i) {
        if (scanf("%lld %lld", &intervals[i].start, &intervals[i].end) != 2) {
            return 0;
        }
        sorted[i] = intervals[i];
    }

    qsort(sorted, (size_t)n, sizeof(Interval), compare_intervals);

    int greedy = 0;
    long long free_time = LLONG_MIN / 4;
    for (i = 0; i < n; ++i) {
        if (sorted[i].start >= free_time) {
            ++greedy;
            free_time = sorted[i].end;
        }
    }

    int best = 0;
    int mask;
    for (mask = 0; mask < (1 << n); ++mask) {
        int count = 0;
        int ok = 1;
        int left;
        for (left = 0; left < n && ok; ++left) {
            int right;
            if ((mask & (1 << left)) == 0) {
                continue;
            }
            ++count;
            for (right = left + 1; right < n; ++right) {
                if ((mask & (1 << right)) != 0 &&
                    !compatible(&intervals[left], &intervals[right])) {
                    ok = 0;
                    break;
                }
            }
        }
        if (ok && count > best) {
            best = count;
        }
    }

    printf("%d %d\n%s\n", greedy, best, greedy == best ? "MATCH" : "DIFFER");
    return 0;
}
