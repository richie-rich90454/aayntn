#include <stdio.h>
#include <string.h>

#define MAXN 200005
#define MAXQ 200005

static int parent[MAXN];
static int size_of[MAXN];

static int hist_child[MAXQ];
static int hist_root[MAXQ];
static int hist_size[MAXQ];
static int hist_top = 0;

static int find_root(int v) {
    while (parent[v] != v) {
        v = parent[v];
    }
    return v;
}

static void unite(int a, int b) {
    int ra = find_root(a);
    int rb = find_root(b);
    if (ra == rb) {
        hist_child[hist_top] = 0;
        hist_root[hist_top] = 0;
        hist_size[hist_top] = 0;
        hist_top += 1;
        return;
    }
    if (size_of[ra] < size_of[rb]) {
        int swap = ra;
        ra = rb;
        rb = swap;
    }
    hist_child[hist_top] = rb;
    hist_root[hist_top] = ra;
    hist_size[hist_top] = size_of[ra];
    hist_top += 1;
    parent[rb] = ra;
    size_of[ra] += size_of[rb];
}

static void rollback(void) {
    if (hist_top == 0) {
        return;
    }
    hist_top -= 1;
    int child = hist_child[hist_top];
    if (child == 0) {
        return;
    }
    parent[child] = child;
    size_of[hist_root[hist_top]] = hist_size[hist_top];
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    for (int v = 1; v <= n; ++v) {
        parent[v] = v;
        size_of[v] = 1;
    }

    for (int i = 0; i < q; ++i) {
        char command[16];
        if (scanf("%15s", command) != 1) {
            break;
        }
        if (strcmp(command, "union") == 0) {
            int u = 0;
            int v = 0;
            if (scanf("%d %d", &u, &v) != 2) break;
            unite(u, v);
        } else if (strcmp(command, "rollback") == 0) {
            rollback();
        } else {
            int u = 0;
            int v = 0;
            if (scanf("%d %d", &u, &v) != 2) break;
            puts(find_root(u) == find_root(v) ? "YES" : "NO");
        }
    }
    return 0;
}
