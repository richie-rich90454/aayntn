#include <cstdio>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using ll = long long;

/*
 * The reference programs use a link-cut tree, not an explicit top tree:
 * preferred paths are the compress clusters and path-parent edges are the
 * rakes. Vertices are 1..n and index 0 is the null node.
 */
class LinkCutForest {
  public:
    explicit LinkCutForest(int vertices)
        : left_(static_cast<size_t>(vertices) + 1, 0),
          right_(static_cast<size_t>(vertices) + 1, 0),
          parent_(static_cast<size_t>(vertices) + 1, 0),
          reversed_(static_cast<size_t>(vertices) + 1, 0),
          stack_(static_cast<size_t>(vertices) + 1, 0),
          value_(static_cast<size_t>(vertices) + 1, 1),
          sum_(static_cast<size_t>(vertices) + 1, 1) {
        value_[0] = 0;
        sum_[0] = 0;
    }

    void link(int x, int y) {
        make_root(x);
        if (find_root(y) != x) {
            parent_[x] = y;
        }
    }

    void cut(int x, int y) {
        make_root(x);
        access_path(y);
        if (left_[y] == x && right_[x] == 0) {
            left_[y] = 0;
            parent_[x] = 0;
            pull(y);
        }
    }

    void set_value(int x, ll v) {
        access_path(x);
        value_[x] = v;
        pull(x);
    }

    ll path_sum(int x, int y) {
        if (find_root(x) != find_root(y)) {
            return 0;
        }
        make_root(x);
        access_path(y);
        return sum_[y];
    }

  private:
    bool is_aux_root(int x) const {
        const int p = parent_[x];
        return p == 0 || (left_[p] != x && right_[p] != x);
    }

    void pull(int x) { sum_[x] = sum_[left_[x]] + sum_[right_[x]] + value_[x]; }

    void apply_reverse(int x) {
        if (x == 0) {
            return;
        }
        std::swap(left_[x], right_[x]);
        reversed_[x] ^= 1;
    }

    void push(int x) {
        if (reversed_[x] == 0) {
            return;
        }
        apply_reverse(left_[x]);
        apply_reverse(right_[x]);
        reversed_[x] = 0;
    }

    void push_path(int x) {
        int top = 0;
        int y = x;
        stack_[static_cast<size_t>(top++)] = y;
        while (!is_aux_root(y)) {
            y = parent_[y];
            stack_[static_cast<size_t>(top++)] = y;
        }
        while (top > 0) {
            push(stack_[static_cast<size_t>(--top)]);
        }
    }

    void rotate(int x) {
        const int y = parent_[x];
        const int z = parent_[y];
        const bool x_is_right = right_[y] == x;
        const int middle = x_is_right ? left_[x] : right_[x];

        if (!is_aux_root(y)) {
            if (left_[z] == y) {
                left_[z] = x;
            } else {
                right_[z] = x;
            }
        }
        parent_[x] = z;

        if (x_is_right) {
            left_[x] = y;
            right_[y] = middle;
        } else {
            right_[x] = y;
            left_[y] = middle;
        }
        if (middle != 0) {
            parent_[middle] = y;
        }
        parent_[y] = x;
        pull(y);
        pull(x);
    }

    void splay(int x) {
        push_path(x);
        while (!is_aux_root(x)) {
            const int y = parent_[x];
            const int z = parent_[y];
            if (!is_aux_root(y)) {
                const bool x_is_left = left_[y] == x;
                const bool y_is_left = left_[z] == y;
                if (x_is_left == y_is_left) {
                    rotate(y);
                } else {
                    rotate(x);
                }
            }
            rotate(x);
        }
    }

    void access_path(int x) {
        int last = 0;
        int y = x;
        while (y != 0) {
            splay(y);
            right_[y] = last;
            pull(y);
            last = y;
            y = parent_[y];
        }
        splay(x);
    }

    void make_root(int x) {
        access_path(x);
        apply_reverse(x);
    }

    int find_root(int x) {
        access_path(x);
        for (;;) {
            push(x);
            if (left_[x] == 0) {
                break;
            }
            x = left_[x];
        }
        splay(x);
        return x;
    }

    std::vector<int> left_;
    std::vector<int> right_;
    std::vector<int> parent_;
    std::vector<int> reversed_;
    std::vector<int> stack_;
    std::vector<ll> value_;
    std::vector<ll> sum_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q) || n <= 0) {
        return 0;
    }
    LinkCutForest forest(n);

    for (int i = 0; i < q; i++) {
        std::string operation;
        long long a = 0;
        long long b = 0;
        if (!(std::cin >> operation >> a >> b)) {
            break;
        }
        if (operation[0] == 's') {
            if (a >= 0 && a < n) {
                forest.set_value(static_cast<int>(a) + 1, b);
            }
            continue;
        }
        if (a < 0 || a >= n || b < 0 || b >= n) {
            if (operation[0] == 'p') {
                std::cout << 0 << '\n';
            }
            continue;
        }
        const int u = static_cast<int>(a) + 1;
        const int v = static_cast<int>(b) + 1;
        if (operation[0] == 'l') {
            forest.link(u, v);
        } else if (operation[0] == 'c') {
            forest.cut(u, v);
        } else {
            std::cout << forest.path_sum(u, v) << '\n';
        }
    }
    return 0;
}
