#include <cstdio>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

/*
 * A link-cut forest on the vertices 1..n. Index 0 is the null node, so all
 * arrays can be read at 0 without a special case.
 */
int main() {
    /* The six languages must agree byte for byte, so "\n" stays one byte. */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int q = 0;
    if (std::scanf("%d %d", &n, &q) != 2 || n <= 0) {
        return 0;
    }

    std::vector<int> child_left(n + 1);
    std::vector<int> child_right(n + 1);
    std::vector<int> parent(n + 1);
    std::vector<int> reversed(n + 1);
    std::vector<int> stack(n + 1);
    std::vector<long long> value(n + 1);
    std::vector<long long> sum(n + 1);

    for (int v = 1; v <= n; v++) {
        value[v] = v;
        sum[v] = v;
    }

    const auto is_aux_root = [&](int x) {
        const int p = parent[x];
        return p == 0 || (child_left[p] != x && child_right[p] != x);
    };
    const auto pull = [&](int x) {
        sum[x] = sum[child_left[x]] + sum[child_right[x]] + value[x];
    };
    const auto apply_reverse = [&](int x) {
        if (x == 0) {
            return;
        }
        const int swap = child_left[x];
        child_left[x] = child_right[x];
        child_right[x] = swap;
        reversed[x] ^= 1;
    };
    const auto push = [&](int x) {
        if (reversed[x] == 0) {
            return;
        }
        apply_reverse(child_left[x]);
        apply_reverse(child_right[x]);
        reversed[x] = 0;
    };
    const auto push_path = [&](int x) {
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
    };
    const auto rotate = [&](int x) {
        const int y = parent[x];
        const int z = parent[y];
        const bool x_is_right = child_right[y] == x;
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
    };
    const auto splay = [&](int x) {
        push_path(x);
        while (!is_aux_root(x)) {
            const int y = parent[x];
            const int z = parent[y];
            if (!is_aux_root(y)) {
                const bool x_is_left = child_left[y] == x;
                const bool y_is_left = child_left[z] == y;
                if (x_is_left == y_is_left) {
                    rotate(y);
                } else {
                    rotate(x);
                }
            }
            rotate(x);
        }
    };
    const auto expose = [&](int x) {
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
    };
    const auto make_root = [&](int x) {
        expose(x);
        apply_reverse(x);
    };
    const auto find_root = [&](int x) {
        expose(x);
        for (;;) {
            push(x);
            if (child_left[x] == 0) {
                break;
            }
            x = child_left[x];
        }
        splay(x);
        return x;
    };
    const auto link = [&](int x, int y) {
        make_root(x);
        if (find_root(y) != x) {
            parent[x] = y;
        }
    };
    const auto cut = [&](int x, int y) {
        make_root(x);
        expose(y);
        if (child_left[y] == x && child_right[x] == 0) {
            child_left[y] = 0;
            parent[x] = 0;
            pull(y);
        }
    };
    const auto path_sum = [&](int x, int y) {
        make_root(x);
        expose(y);
        return sum[y];
    };

    for (int i = 0; i < q; i++) {
        char operation[8] = {};
        int u = 0;
        int v = 0;
        if (std::scanf("%7s %d %d", operation, &u, &v) != 3) {
            break;
        }
        u++;
        v++;
        if (operation[0] == 'l') {
            link(u, v);
        } else if (operation[0] == 'c') {
            cut(u, v);
        } else {
            std::printf("%lld\n", path_sum(u, v));
        }
    }
    return 0;
}
