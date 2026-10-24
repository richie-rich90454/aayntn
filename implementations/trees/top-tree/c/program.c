#include <stdio.h>
#include <stdlib.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * The reference programs use a link-cut tree, not an explicit top tree.
 * Preferred paths are the compress clusters, path-parent edges are the rakes,
 * and access restructures them. Vertices are 1..n and index 0 is the null node.
 */
static int n;
static int *child_left;
static int *child_right;
static int *parent;
static int *reversed;
static int *stack;
static long long *value;
static long long *sum;

static int is_aux_root(int x) {
    const int p = parent[x];
    return p == 0 || (child_left[p] != x && child_right[p] != x);
}

static void pull(int x) {
    sum[x] = sum[child_left[x]] + sum[child_right[x]] + value[x];
}

static void apply_reverse(int x) {
    if (x == 0) {
        return;
    }
    const int swap = child_left[x];
    child_left[x] = child_right[x];
    child_right[x] = swap;
    reversed[x] ^= 1;
}

static void push(int x) {
    if (reversed[x] == 0) {
        return;
    }
    apply_reverse(child_left[x]);
    apply_reverse(child_right[x]);
    reversed[x] = 0;
}

static void push_path(int x) {
    int top = 0;
    int y = x;
    stack[top++] = y;
    while (!is_aux_root(y)) {
        y = parent[y];
        stack[top++] = y;
    }
    while (top > 0) {
        push(stack[--top]);
    }
}

static void rotate(int x) {
    const int y = parent[x];
    const int z = parent[y];
    const int x_is_right = child_right[y] == x;
    const int middle = x_is_right ? child_left[x] : child_right[x];

    if (!is_aux_root(y)) {
        if (child_left[z] == y) {
            child_left[z] = x;
        } else {
            child_right[z] = x;
        }
    }
    parent[x] = z;

    if (x_is_right) {
        child_left[x] = y;
        child_right[y] = middle;
    } else {
        child_right[x] = y;
        child_left[y] = middle;
    }
    if (middle != 0) {
        parent[middle] = y;
    }
    parent[y] = x;
    pull(y);
    pull(x);
}

static void splay(int x) {
    push_path(x);
    while (!is_aux_root(x)) {
        const int y = parent[x];
        const int z = parent[y];
        if (!is_aux_root(y)) {
            const int x_is_left = child_left[y] == x;
            const int y_is_left = child_left[z] == y;
            if (x_is_left == y_is_left) {
                rotate(y);
            } else {
                rotate(x);
            }
        }
        rotate(x);
    }
}

static void access_path(int x) {
    int last = 0;
    int y = x;
    while (y != 0) {
        splay(y);
        child_right[y] = last;
        pull(y);
        last = y;
        y = parent[y];
    }
    splay(x);
}

static void make_root(int x) {
    access_path(x);
    apply_reverse(x);
}

static int find_root(int x) {
    access_path(x);
    for (;;) {
        push(x);
        if (child_left[x] == 0) {
            break;
        }
        x = child_left[x];
    }
    splay(x);
    return x;
}

static void link(int x, int y) {
    make_root(x);
    if (find_root(y) != x) {
        parent[x] = y;
    }
}

static void cut(int x, int y) {
    make_root(x);
    access_path(y);
    if (child_left[y] == x && child_right[x] == 0) {
        child_left[y] = 0;
        parent[x] = 0;
        pull(y);
    }
}

static void set_value(int x, long long v) {
    access_path(x);
    value[x] = v;
    pull(x);
}

static long long path_sum(int x, int y) {
    if (find_root(x) != find_root(y)) {
        return 0;
    }
    make_root(x);
    access_path(y);
    return sum[y];
}

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int q = 0;
    if (scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    child_left = calloc((size_t)n + 1, sizeof *child_left);
    child_right = calloc((size_t)n + 1, sizeof *child_right);
    parent = calloc((size_t)n + 1, sizeof *parent);
    reversed = calloc((size_t)n + 1, sizeof *reversed);
    stack = calloc((size_t)n + 1, sizeof *stack);
    value = calloc((size_t)n + 1, sizeof *value);
    sum = calloc((size_t)n + 1, sizeof *sum);
    if (child_left == NULL || child_right == NULL || parent == NULL || reversed == NULL ||
        stack == NULL || value == NULL || sum == NULL) {
        return 1;
    }

    for (int v = 1; v <= n; v++) {
        value[v] = 1;
        sum[v] = 1;
    }

    for (int i = 0; i < q; i++) {
        char operation[8];
        long long a = 0;
        long long b = 0;
        if (scanf("%7s %lld %lld", operation, &a, &b) != 3) {
            break;
        }
        if (operation[0] == 's') {
            if (a >= 0 && a < n) {
                set_value((int)a + 1, b);
            }
            continue;
        }
        if (a < 0 || a >= n || b < 0 || b >= n) {
            if (operation[0] == 'p') {
                printf("0\n");
            }
            continue;
        }
        const int u = (int)a + 1;
        const int v = (int)b + 1;
        if (operation[0] == 'l') {
            link(u, v);
        } else if (operation[0] == 'c') {
            cut(u, v);
        } else {
            printf("%lld\n", path_sum(u, v));
        }
    }

    free(child_left);
    free(child_right);
    free(parent);
    free(reversed);
    free(stack);
    free(value);
    free(sum);
    return 0;
}
