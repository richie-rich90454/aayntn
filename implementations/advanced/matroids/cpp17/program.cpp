#include <algorithm>
#include <cstddef>
#include <iostream>
#include <numeric>
#include <utility>
#include <vector>

namespace {

struct Edge {
    int u;
    int v;
    long long weight;
};

class Dsu {
public:
    explicit Dsu(int n) : parent_(n), size_(n, 1) {
        std::iota(parent_.begin(), parent_.end(), 0);
    }

    bool unite(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) {
            return false;
        }
        if (size_[ra] < size_[rb]) {
            std::swap(ra, rb);
        }
        parent_[rb] = ra;
        size_[ra] += size_[rb];
        return true;
    }

private:
    int find(int x) {
        while (parent_[x] != x) {
            parent_[x] = parent_[parent_[x]];
            x = parent_[x];
        }
        return x;
    }

    std::vector<int> parent_;
    std::vector<int> size_;
};

}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m) || n < 0 || m < 0) {
        return 0;
    }

    std::vector<Edge> edges;
    edges.reserve(m > 0 ? static_cast<std::size_t>(m) : 0);
    for (int k = 0; k < m; ++k) {
        Edge edge{};
        if (!(std::cin >> edge.u >> edge.v >> edge.weight)) {
            break;
        }
        --edge.u;
        --edge.v;
        edges.push_back(edge);
    }

    if (n < 1) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::sort(edges.begin(), edges.end(), [](const Edge &a, const Edge &b) {
        return a.weight > b.weight;
    });

    Dsu dsu(n);
    long long total = 0;
    for (const Edge &edge : edges) {
        if (dsu.unite(edge.u, edge.v)) {
            total += edge.weight;
        }
    }
    std::cout << total << '\n';
    return 0;
}
