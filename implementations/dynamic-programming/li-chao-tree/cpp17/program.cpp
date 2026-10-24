#include <algorithm>
#include <cstddef>
#include <iostream>
#include <limits>
#include <utility>
#include <vector>

namespace {

struct Line {
    long long m = 0;
    long long b = 0;
};

struct Operation {
    int kind = 0;
    long long m = 0;
    long long b = 0;
    long long x = 0;
};

class LiChaoTree {
public:
    explicit LiChaoTree(std::vector<long long> coordinates)
        : xs_(std::move(coordinates)),
          tree_(4 * xs_.size()),
          used_(4 * xs_.size(), 0) {
    }

    void add(Line line) {
        add(line, 1, 0, static_cast<int>(xs_.size()) - 1);
    }

    long long query(long long x) const {
        const int index = static_cast<int>(
            std::lower_bound(xs_.begin(), xs_.end(), x) - xs_.begin());
        return query(1, 0, static_cast<int>(xs_.size()) - 1, index);
    }

private:
    static long long evaluate(const Line &line, long long x) {
        return line.m * x + line.b;
    }

    void add(Line incoming, int node, int left, int right) {
        if (!used_[node]) {
            used_[node] = 1;
            tree_[node] = incoming;
            return;
        }

        const int mid = left + (right - left) / 2;
        const bool betterLeft = evaluate(incoming, xs_[left]) < evaluate(tree_[node], xs_[left]);
        const bool betterMid = evaluate(incoming, xs_[mid]) < evaluate(tree_[node], xs_[mid]);

        if (betterMid) {
            std::swap(tree_[node], incoming);
        }

        if (left == right) {
            return;
        }

        if (betterLeft != betterMid) {
            add(incoming, node * 2, left, mid);
        } else {
            add(incoming, node * 2 + 1, mid + 1, right);
        }
    }

    long long query(int node, int left, int right, int index) const {
        long long best = used_[node]
                             ? evaluate(tree_[node], xs_[index])
                             : std::numeric_limits<long long>::max();

        if (left == right) {
            return best;
        }

        const int mid = left + (right - left) / 2;
        const long long child = index <= mid
                                    ? query(node * 2, left, mid, index)
                                    : query(node * 2 + 1, mid + 1, right, index);
        return std::min(best, child);
    }

    std::vector<long long> xs_;
    std::vector<Line> tree_;
    std::vector<char> used_;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int q = 0;
    if (!(std::cin >> q) || q <= 0) {
        return 0;
    }

    std::vector<Operation> operations(static_cast<std::size_t>(q));
    std::vector<long long> coordinates;
    coordinates.reserve(static_cast<std::size_t>(q));

    for (int i = 0; i < q; i++) {
        std::cin >> operations[i].kind;
        if (operations[i].kind == 1) {
            std::cin >> operations[i].m >> operations[i].b;
        } else {
            std::cin >> operations[i].x;
            coordinates.push_back(operations[i].x);
        }
    }

    std::sort(coordinates.begin(), coordinates.end());
    coordinates.erase(std::unique(coordinates.begin(), coordinates.end()), coordinates.end());

    if (coordinates.empty()) {
        return 0;
    }

    LiChaoTree tree(std::move(coordinates));

    for (const Operation &operation : operations) {
        if (operation.kind == 1) {
            tree.add(Line{operation.m, operation.b});
        } else {
            std::cout << tree.query(operation.x) << '\n';
        }
    }

    return 0;
}
