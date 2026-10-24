#include <iostream>
#include <map>
#include <utility>
#include <vector>

class RollbackDsu {
public:
    explicit RollbackDsu(int n) : parent_(n + 1), set_size_(n + 1, 1) {
        history_.reserve(n + 1);
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
            return;
        }
        if (set_size_[ra] < set_size_[rb]) {
            std::swap(ra, rb);
        }
        history_.push_back({rb, ra, set_size_[ra]});
        parent_[rb] = ra;
        set_size_[ra] += set_size_[rb];
    }

    void rollbackTo(int checkpoint) {
        while (static_cast<int>(history_.size()) > checkpoint) {
            Frame frame = history_.back();
            history_.pop_back();
            parent_[frame.child] = frame.child;
            set_size_[frame.root] = frame.old_size;
        }
    }

    bool connected(int a, int b) const { return find(a) == find(b); }

    int checkpoint() const { return static_cast<int>(history_.size()); }

private:
    struct Frame {
        int child;
        int root;
        int old_size;
    };

    std::vector<int> parent_;
    std::vector<int> set_size_;
    std::vector<Frame> history_;
};

class Solver {
public:
    Solver(int n, int q)
        : q_(q),
          op_type_(q + 1),
          op_u_(q + 1),
          op_v_(q + 1),
          edge_u_(q + 1),
          edge_v_(q + 1),
          buckets_(4 * q + 5),
          dsu_(n),
          answer_(q + 1, 0) {}

    void setOperation(int time, int type, int u, int v) {
        op_type_[time] = type;
        op_u_[time] = u;
        op_v_[time] = v;
    }

    void addEdge(int time, int u, int v) {
        int a = u < v ? u : v;
        int b = u < v ? v : u;
        ++edge_count_;
        edge_u_[edge_count_] = u;
        edge_v_[edge_count_] = v;
        active_[{a, b}] = {time, edge_count_};
    }

    void removeEdge(int time, int u, int v) {
        int a = u < v ? u : v;
        int b = u < v ? v : u;
        auto it = active_.find({a, b});
        if (it == active_.end()) {
            return;
        }
        int start = it->second.first;
        int edge = it->second.second;
        if (start <= time - 1) {
            addInterval(1, 1, q_, start, time - 1, edge);
        }
        active_.erase(it);
    }

    void closeOpenIntervals() {
        for (const auto& entry : active_) {
            addInterval(1, 1, q_, entry.second.first, q_, entry.second.second);
        }
    }

    void run() {
        solve(1, 1, q_);
        for (int t = 1; t <= q_; ++t) {
            if (op_type_[t] == 3) {
                std::cout << (answer_[t] ? "YES" : "NO") << '\n';
            }
        }
    }

private:
    void addInterval(int node, int lo, int hi, int ql, int qr, int edge) {
        if (qr < lo || hi < ql) {
            return;
        }
        if (ql <= lo && hi <= qr) {
            buckets_[node].push_back(edge);
            return;
        }
        int mid = (lo + hi) / 2;
        addInterval(node * 2, lo, mid, ql, qr, edge);
        addInterval(node * 2 + 1, mid + 1, hi, ql, qr, edge);
    }

    void solve(int node, int lo, int hi) {
        const int saved = dsu_.checkpoint();
        for (int id : buckets_[node]) {
            dsu_.unite(edge_u_[id], edge_v_[id]);
        }
        if (lo == hi) {
            if (op_type_[lo] == 3) {
                answer_[lo] = dsu_.connected(op_u_[lo], op_v_[lo]) ? 1 : 0;
            }
        } else {
            int mid = (lo + hi) / 2;
            solve(node * 2, lo, mid);
            solve(node * 2 + 1, mid + 1, hi);
        }
        dsu_.rollbackTo(saved);
    }

    int q_;
    std::vector<int> op_type_;
    std::vector<int> op_u_;
    std::vector<int> op_v_;
    std::vector<int> edge_u_;
    std::vector<int> edge_v_;
    std::vector<std::vector<int>> buckets_;
    RollbackDsu dsu_;
    std::vector<char> answer_;
    std::map<std::pair<int, int>, std::pair<int, int>> active_;
    int edge_count_ = 0;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    if (q <= 0) {
        return 0;
    }
    Solver solver(n, q);
    for (int t = 1; t <= q; ++t) {
        int type = 0;
        int u = 0;
        int v = 0;
        if (!(std::cin >> type >> u >> v)) {
            break;
        }
        solver.setOperation(t, type, u, v);
        if (type == 1) {
            solver.addEdge(t, u, v);
        } else if (type == 2) {
            solver.removeEdge(t, u, v);
        }
    }
    solver.closeOpenIntervals();
    solver.run();
    return 0;
}
