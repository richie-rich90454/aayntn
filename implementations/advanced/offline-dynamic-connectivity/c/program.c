#include <stdio.h>
#include <string.h>

#define MAXN 200005
#define MAXQ 200005
#define MAXENTRIES 8000005
#define HSIZE 1048576
#define HMASK (HSIZE - 1)

static int op_type[MAXQ];
static int op_u[MAXQ];
static int op_v[MAXQ];

static int edge_u[MAXQ];
static int edge_v[MAXQ];
static int edge_count;

static int head[4 * MAXQ + 5];
static int next_entry[MAXENTRIES];
static int entry_edge[MAXENTRIES];
static int entry_count;

static int hash_u[HSIZE];
static int hash_v[HSIZE];
static int hash_start[HSIZE];
static int hash_edge[HSIZE];

static int parent[MAXN];
static int set_size[MAXN];
static int hist_child[MAXQ];
static int hist_root[MAXQ];
static int hist_size[MAXQ];
static int hist_top;

static int answer[MAXQ];

static int pair_find(int u, int v) {
    if (u > v) {
        int swap = u;
        u = v;
        v = swap;
    }
    int h = (u * 31 + v) & HMASK;
    while (hash_u[h] != 0) {
        if (hash_u[h] == u && hash_v[h] == v) {
            return h;
        }
        h = (h + 1) & HMASK;
    }
    return -1;
}

static int pair_slot(int u, int v) {
    if (u > v) {
        int swap = u;
        u = v;
        v = swap;
    }
    int h = (u * 31 + v) & HMASK;
    while (hash_u[h] != 0) {
        if (hash_u[h] == u && hash_v[h] == v) {
            return h;
        }
        h = (h + 1) & HMASK;
    }
    hash_u[h] = u;
    hash_v[h] = v;
    return h;
}

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
        return;
    }
    if (set_size[ra] < set_size[rb]) {
        int swap = ra;
        ra = rb;
        rb = swap;
    }
    hist_child[hist_top] = rb;
    hist_root[hist_top] = ra;
    hist_size[hist_top] = set_size[ra];
    hist_top += 1;
    parent[rb] = ra;
    set_size[ra] += set_size[rb];
}

static void rollback_to(int checkpoint) {
    while (hist_top > checkpoint) {
        hist_top -= 1;
        parent[hist_child[hist_top]] = hist_child[hist_top];
        set_size[hist_root[hist_top]] = hist_size[hist_top];
    }
}

static void add_interval(int node, int lo, int hi, int ql, int qr, int edge) {
    if (qr < lo || hi < ql) {
        return;
    }
    if (ql <= lo && hi <= qr) {
        entry_count += 1;
        next_entry[entry_count] = head[node];
        entry_edge[entry_count] = edge;
        head[node] = entry_count;
        return;
    }
    int mid = (lo + hi) / 2;
    add_interval(node * 2, lo, mid, ql, qr, edge);
    add_interval(node * 2 + 1, mid + 1, hi, ql, qr, edge);
}

static void solve(int node, int lo, int hi) {
    int checkpoint = hist_top;
    for (int e = head[node]; e != 0; e = next_entry[e]) {
        int id = entry_edge[e];
        unite(edge_u[id], edge_v[id]);
    }
    if (lo == hi) {
        if (op_type[lo] == 3) {
            answer[lo] = find_root(op_u[lo]) == find_root(op_v[lo]);
        }
    } else {
        int mid = (lo + hi) / 2;
        solve(node * 2, lo, mid);
        solve(node * 2 + 1, mid + 1, hi);
    }
    rollback_to(checkpoint);
}

int main(void) {
    int n = 0;
    int q = 0;
    if (scanf("%d %d", &n, &q) != 2) {
        return 0;
    }
    if (q <= 0) {
        return 0;
    }
    for (int v = 1; v <= n; ++v) {
        parent[v] = v;
        set_size[v] = 1;
    }
    for (int t = 1; t <= q; ++t) {
        int type = 0;
        int u = 0;
        int v = 0;
        if (scanf("%d %d %d", &type, &u, &v) != 3) {
            break;
        }
        op_type[t] = type;
        op_u[t] = u;
        op_v[t] = v;
        if (type == 1) {
            edge_count += 1;
            edge_u[edge_count] = u;
            edge_v[edge_count] = v;
            int slot = pair_slot(u, v);
            hash_start[slot] = t;
            hash_edge[slot] = edge_count;
        } else if (type == 2) {
            int slot = pair_find(u, v);
            if (slot >= 0 && hash_start[slot] != 0) {
                int start = hash_start[slot];
                if (start <= t - 1) {
                    add_interval(1, 1, q, start, t - 1, hash_edge[slot]);
                }
                hash_start[slot] = 0;
            }
        }
    }
    for (int h = 0; h < HSIZE; ++h) {
        if (hash_start[h] != 0) {
            add_interval(1, 1, q, hash_start[h], q, hash_edge[h]);
        }
    }
    solve(1, 1, q);
    for (int t = 1; t <= q; ++t) {
        if (op_type[t] == 3) {
            puts(answer[t] ? "YES" : "NO");
        }
    }
    return 0;
}
