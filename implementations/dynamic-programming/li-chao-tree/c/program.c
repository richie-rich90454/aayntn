#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    long long m;
    long long b;
} Line;

typedef struct {
    int kind;
    long long m;
    long long b;
    long long x;
} Operation;

static Line *tree;
static unsigned char *used;
static const long long *xs;

static long long evaluate(Line line, long long x) {
    return line.m * x + line.b;
}

static void add_line(Line incoming, int node, int left, int right) {
    int mid;
    int better_left;
    int better_mid;

    if (!used[node]) {
        used[node] = 1;
        tree[node] = incoming;
        return;
    }

    mid = left + (right - left) / 2;
    better_left = evaluate(incoming, xs[left]) < evaluate(tree[node], xs[left]);
    better_mid = evaluate(incoming, xs[mid]) < evaluate(tree[node], xs[mid]);

    if (better_mid) {
        Line displaced = tree[node];
        tree[node] = incoming;
        incoming = displaced;
    }

    if (left == right) {
        return;
    }

    if (better_left != better_mid) {
        add_line(incoming, node * 2, left, mid);
    } else {
        add_line(incoming, node * 2 + 1, mid + 1, right);
    }
}

static long long query(int node, int left, int right, int index) {
    long long best = used[node] ? evaluate(tree[node], xs[index]) : LLONG_MAX;
    long long child;
    int mid;

    if (left == right) {
        return best;
    }

    mid = left + (right - left) / 2;
    if (index <= mid) {
        child = query(node * 2, left, mid, index);
    } else {
        child = query(node * 2 + 1, mid + 1, right, index);
    }

    return child < best ? child : best;
}

static int compare_long_long(const void *a, const void *b) {
    long long left = *(const long long *)a;
    long long right = *(const long long *)b;
    if (left < right) {
        return -1;
    }
    if (left > right) {
        return 1;
    }
    return 0;
}

static int rank_of(const long long *values, int count, long long x) {
    int lo = 0;
    int hi = count - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (values[mid] < x) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
}

int main(void) {
    int q;
    int read = 0;
    int count = 0;
    int k = 0;
    int i;
    Operation *operations;
    long long *values;

    if (scanf("%d", &q) != 1 || q <= 0) {
        return 0;
    }

    operations = (Operation *)malloc((size_t)q * sizeof(Operation));
    values = (long long *)malloc((size_t)q * sizeof(long long));
    if (operations == NULL || values == NULL) {
        free(operations);
        free(values);
        return 0;
    }

    for (i = 0; i < q; i++) {
        int kind = 0;
        if (scanf("%d", &kind) != 1) {
            break;
        }
        operations[i].kind = kind;
        operations[i].m = 0;
        operations[i].b = 0;
        operations[i].x = 0;
        if (kind == 1) {
            if (scanf("%lld", &operations[i].m) != 1 ||
                scanf("%lld", &operations[i].b) != 1) {
                break;
            }
        } else {
            if (scanf("%lld", &operations[i].x) != 1) {
                break;
            }
            values[count++] = operations[i].x;
        }
        read++;
    }
    q = read;

    qsort(values, (size_t)count, sizeof(long long), compare_long_long);
    for (i = 0; i < count; i++) {
        if (k == 0 || values[i] != values[k - 1]) {
            values[k++] = values[i];
        }
    }

    if (k == 0) {
        free(operations);
        free(values);
        return 0;
    }

    tree = (Line *)calloc((size_t)(4 * k), sizeof(Line));
    used = (unsigned char *)calloc((size_t)(4 * k), sizeof(unsigned char));
    if (tree == NULL || used == NULL) {
        free(tree);
        free(used);
        free(operations);
        free(values);
        return 0;
    }

    xs = values;

    for (i = 0; i < q; i++) {
        if (operations[i].kind == 1) {
            Line line;
            line.m = operations[i].m;
            line.b = operations[i].b;
            add_line(line, 1, 0, k - 1);
        } else {
            int index = rank_of(values, k, operations[i].x);
            printf("%lld\n", query(1, 0, k - 1, index));
        }
    }

    free(tree);
    free(used);
    free(operations);
    free(values);
    return 0;
}
