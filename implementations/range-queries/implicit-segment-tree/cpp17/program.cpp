#include <cstdio>
#include <vector>

/*
 * An implicit segment tree over [1, m]. Only the nodes on the paths that an
 * update actually visits are allocated; a missing child means that every value
 * in its interval is still zero.
 */
struct Node {
    int left = 0;
    int right = 0;
    long long sum = 0;
};

static std::vector<Node> pool;

static int newNode() {
    pool.push_back(Node{});
    return static_cast<int>(pool.size()) - 1;
}

static void add(int root, int lo, int hi, int pos, long long delta) {
    pool[root].sum += delta;
    if (lo == hi) {
        return;
    }
    int mid = lo + (hi - lo) / 2;
    if (pos <= mid) {
        if (pool[root].left == 0) {
            pool[root].left = newNode();
        }
        add(pool[root].left, lo, mid, pos, delta);
    } else {
        if (pool[root].right == 0) {
            pool[root].right = newNode();
        }
        add(pool[root].right, mid + 1, hi, pos, delta);
    }
}

static long long query(int root, int lo, int hi, int ql, int qr) {
    if (root == 0 || qr < lo || hi < ql) {
        return 0;
    }
    if (ql <= lo && hi <= qr) {
        return pool[root].sum;
    }
    int mid = lo + (hi - lo) / 2;
    long long total = 0;
    if (ql <= mid) {
        total += query(pool[root].left, lo, mid, ql, qr);
    }
    if (qr > mid) {
        total += query(pool[root].right, mid + 1, hi, ql, qr);
    }
    return total;
}

int main() {
    int m = 0;
    int q = 0;
    if (std::scanf("%d %d", &m, &q) != 2 || m < 1 || q < 0) {
        return 0;
    }

    int bits = 0;
    long long size = 1;
    while (size < m) {
        size <<= 1;
        ++bits;
    }
    pool.reserve(static_cast<std::size_t>(2 + static_cast<long long>(q) * (bits + 1)));

    pool.push_back(Node{}); // The null node at index 0.
    newNode();              // The root over [1, m].

    for (int k = 0; k < q; ++k) {
        int kind = 0;
        if (std::scanf("%d", &kind) != 1) {
            break;
        }
        if (kind == 1) {
            int pos = 0;
            long long delta = 0;
            if (std::scanf("%d %lld", &pos, &delta) != 2) {
                break;
            }
            add(1, 1, m, pos, delta);
        } else if (kind == 2) {
            int left = 0;
            int right = 0;
            if (std::scanf("%d %d", &left, &right) != 2) {
                break;
            }
            std::printf("%lld\n", query(1, 1, m, left, right));
        } else {
            break;
        }
    }

    return 0;
}
