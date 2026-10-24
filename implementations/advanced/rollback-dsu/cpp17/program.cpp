#include <iostream>
#include <string>
#include <utility>
#include <vector>

class RollbackDsu {
public:
    explicit RollbackDsu(int n) : parent_(n + 1), size_(n + 1, 1) {
        for (int v = 1; v <= n; ++v) {
            parent_[v] = v;
        }
    }

    int find(int v) const {
        while (parent_[v] != v) {
            v = parent_[v];
        }
        return v;
    }

    void unite(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) {
            history_.push_back({0, 0, 0});
            return;
        }
        if (size_[ra] < size_[rb]) {
            std::swap(ra, rb);
        }
        history_.push_back({rb, ra, size_[ra]});
        parent_[rb] = ra;
        size_[ra] += size_[rb];
    }

    void rollback() {
        if (history_.empty()) {
            return;
        }
        Frame frame = history_.back();
        history_.pop_back();
        if (frame.child == 0) {
            return;
        }
        parent_[frame.child] = frame.child;
        size_[frame.root] = frame.old_size;
    }

    bool same(int a, int b) const { return find(a) == find(b); }

private:
    struct Frame {
        int child;
        int root;
        int old_size;
    };

    std::vector<int> parent_;
    std::vector<int> size_;
    std::vector<Frame> history_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    RollbackDsu dsu(n);

    for (int i = 0; i < q; ++i) {
        std::string command;
        if (!(std::cin >> command)) {
            break;
        }
        if (command == "union") {
            int u = 0;
            int v = 0;
            std::cin >> u >> v;
            dsu.unite(u, v);
        } else if (command == "rollback") {
            dsu.rollback();
        } else {
            int u = 0;
            int v = 0;
            std::cin >> u >> v;
            std::cout << (dsu.same(u, v) ? "YES" : "NO") << '\n';
        }
    }
    return 0;
}
