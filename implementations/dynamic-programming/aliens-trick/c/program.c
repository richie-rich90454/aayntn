#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long slope;
    long long intercept;
    int groups;
    unsigned char present;
} Line;

static int better(long long m1, long long b1, int c1, long long m2, long long b2, int c2,
                  long long x) {
    const long long left = m1 * x + b1;
    const long long right = m2 * x + b2;
    if (left != right) {
        return left < right;
    }
    return c1 > c2;
}

static void insert(Line *tree, const long long *prefix, int node, int left, int right,
                   Line line) {
    if (!tree[node].present) {
        tree[node] = line;
        tree[node].present = 1;
        return;
    }

    const int mid = left + (right - left) / 2;
    if (better(line.slope, line.intercept, line.groups, tree[node].slope, tree[node].intercept,
               tree[node].groups, prefix[mid])) {
        const Line previous = tree[node];
        tree[node] = line;
        line = previous;
    }
    if (left == right) {
        return;
    }

    if (better(line.slope, line.intercept, line.groups, tree[node].slope, tree[node].intercept,
               tree[node].groups, prefix[left])) {
        insert(tree, prefix, 2 * node, left, mid, line);
    } else if (better(line.slope, line.intercept, line.groups, tree[node].slope,
                      tree[node].intercept, tree[node].groups, prefix[right])) {
        insert(tree, prefix, 2 * node + 1, mid + 1, right, line);
    }
}

static Line query(const Line *tree, const long long *prefix, int n, int index) {
    int node = 1;
    int left = 0;
    int right = n;
    const long long x = prefix[index];
    Line best = {0, 0, 0, 0};

    while (1) {
        if (tree[node].present &&
            (!best.present || better(tree[node].slope, tree[node].intercept, tree[node].groups,
                                     best.slope, best.intercept, best.groups, x))) {
            best = tree[node];
        }
        if (left == right) {
            break;
        }
        const int mid = left + (right - left) / 2;
        if (index <= mid) {
            node *= 2;
            right = mid;
        } else {
            node = 2 * node + 1;
            left = mid + 1;
        }
    }
    return best;
}

static long long penalized(const long long *prefix, int n, long long penalty, int *out_groups) {
    const int size = 4 * (n + 1) + 8;
    Line *tree = calloc((size_t)size, sizeof *tree);
    if (tree == NULL) {
        *out_groups = 0;
        return 0;
    }

    const Line first = {0, 0, 0, 1};
    insert(tree, prefix, 1, 0, n, first);

    long long value = 0;
    int groups = 0;
    for (int i = 1; i <= n; i++) {
        const long long x = prefix[i];
        const Line line = query(tree, prefix, n, i);
        value = line.slope * x + line.intercept + x * x + penalty;
        groups = line.groups + 1;
        const Line next = {-2 * x, value + x * x, groups, 1};
        insert(tree, prefix, 1, 0, n, next);
    }

    free(tree);
    *out_groups = groups;
    return value;
}

int main(void) {
    int n = 0;
    int k = 0;
    if (scanf("%d %d", &n, &k) != 2) {
        return 0;
    }
    if (n <= 0) {
        printf("0\n");
        return 0;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    long long *prefix = malloc(((size_t)n + 1) * sizeof *prefix);
    if (prefix == NULL) {
        return 0;
    }
    prefix[0] = 0;
    for (int i = 1; i <= n; i++) {
        long long value = 0;
        if (scanf("%lld", &value) != 1) {
            value = 0;
        }
        prefix[i] = prefix[i - 1] + value;
    }

    const long long total = prefix[n];
    long long low = 0;
    long long high = total * total + 1;
    while (low < high) {
        const long long mid = low + (high - low + 1) / 2;
        int groups = 0;
        penalized(prefix, n, mid, &groups);
        if (groups >= k) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    int groups = 0;
    const long long value = penalized(prefix, n, low, &groups);
    printf("%lld\n", value - low * (long long)k);

    free(prefix);
    return 0;
}
