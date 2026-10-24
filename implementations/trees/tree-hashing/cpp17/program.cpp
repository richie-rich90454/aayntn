#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>

namespace {

constexpr std::uint32_t kBaseFirst = 1000003u;
constexpr std::uint32_t kBaseSecond = 999983u;

struct SubtreeHash {
    std::uint32_t first;
    std::uint32_t second;
};

std::uint32_t mix_first(std::uint32_t value) {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
}

std::uint32_t mix_second(std::uint32_t value) {
    value += 0x9e3779b9u;
    value ^= value << 5;
    value ^= value >> 13;
    value ^= value << 17;
    return value;
}

struct TreeHash {
    int n = 0;
    int root = 0;
    std::vector<int> start;
    std::vector<int> children;
    std::vector<std::uint32_t> first;
    std::vector<std::uint32_t> second;
};

bool read_tree(TreeHash &tree, const int n) {
    tree.n = n;
    std::vector<int> parent(static_cast<std::size_t>(n));
    for (int i = 0; i < n; i++) {
        if (!(std::cin >> parent[static_cast<std::size_t>(i)])) {
            parent[static_cast<std::size_t>(i)] = -1;
        }
    }

    int root = -1;
    for (int i = 0; i < n; i++) {
        const int p = parent[static_cast<std::size_t>(i)];
        if (p < 0 || p >= n) {
            parent[static_cast<std::size_t>(i)] = -1;
            if (root < 0) {
                root = i;
            }
        }
    }
    if (root < 0) {
        root = 0;
        parent[0] = -1;
    }
    tree.root = root;

    std::vector<int> count(static_cast<std::size_t>(n), 0);
    for (int i = 0; i < n; i++) {
        const int p = parent[static_cast<std::size_t>(i)];
        if (i != root && p >= 0) {
            count[static_cast<std::size_t>(p)]++;
        }
    }
    tree.start.assign(static_cast<std::size_t>(n) + 1, 0);
    for (int i = 0; i < n; i++) {
        tree.start[static_cast<std::size_t>(i) + 1] =
            tree.start[static_cast<std::size_t>(i)] + count[static_cast<std::size_t>(i)];
    }
    tree.children.assign(static_cast<std::size_t>(n > 1 ? n - 1 : 1), 0);
    std::vector<int> cursor(static_cast<std::size_t>(n), 0);
    for (int i = 0; i < n; i++) {
        const int p = parent[static_cast<std::size_t>(i)];
        if (i != root && p >= 0) {
            const std::size_t slot = static_cast<std::size_t>(
                tree.start[static_cast<std::size_t>(p)] +
                cursor[static_cast<std::size_t>(p)]);
            tree.children[slot] = i;
            cursor[static_cast<std::size_t>(p)]++;
        }
    }

    std::vector<int> order(static_cast<std::size_t>(n));
    int order_count = 0;
    order[static_cast<std::size_t>(order_count++)] = root;
    for (int head = 0; head < order_count; head++) {
        const int u = order[static_cast<std::size_t>(head)];
        for (int e = tree.start[static_cast<std::size_t>(u)];
             e < tree.start[static_cast<std::size_t>(u) + 1]; e++) {
            order[static_cast<std::size_t>(order_count++)] =
                tree.children[static_cast<std::size_t>(e)];
        }
    }

    tree.first.assign(static_cast<std::size_t>(n), 0);
    tree.second.assign(static_cast<std::size_t>(n), 0);
    std::vector<SubtreeHash> buffer(static_cast<std::size_t>(n));

    for (int index = order_count - 1; index >= 0; index--) {
        const int u = order[static_cast<std::size_t>(index)];
        int degree = 0;
        for (int e = tree.start[static_cast<std::size_t>(u)];
             e < tree.start[static_cast<std::size_t>(u) + 1]; e++) {
            const int c = tree.children[static_cast<std::size_t>(e)];
            buffer[static_cast<std::size_t>(degree)].first =
                tree.first[static_cast<std::size_t>(c)];
            buffer[static_cast<std::size_t>(degree)].second =
                tree.second[static_cast<std::size_t>(c)];
            degree++;
        }
        std::sort(buffer.begin(),
                  buffer.begin() + static_cast<std::ptrdiff_t>(degree),
                  [](const SubtreeHash &a, const SubtreeHash &b) {
                      if (a.first != b.first) {
                          return a.first < b.first;
                      }
                      return a.second < b.second;
                  });

        std::uint32_t fold_first = 0;
        std::uint32_t fold_second = 0;
        for (int i = 0; i < degree; i++) {
            fold_first =
                fold_first * kBaseFirst + mix_first(buffer[static_cast<std::size_t>(i)].first);
            fold_second =
                fold_second * kBaseSecond + mix_second(buffer[static_cast<std::size_t>(i)].second);
        }
        tree.first[static_cast<std::size_t>(u)] = fold_first * kBaseFirst + 1;
        tree.second[static_cast<std::size_t>(u)] = fold_second * kBaseSecond + 1;
    }

    return true;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n < 1) {
        std::cout << "DIFFERENT\n";
        return 0;
    }

    TreeHash first_tree;
    read_tree(first_tree, n);

    int m = 0;
    if (!(std::cin >> m) || m < 1) {
        std::cout << "DIFFERENT\n";
        return 0;
    }

    TreeHash second_tree;
    read_tree(second_tree, m);

    const bool same = first_tree.n == second_tree.n &&
                      first_tree.first[static_cast<std::size_t>(first_tree.root)] ==
                          second_tree.first[static_cast<std::size_t>(second_tree.root)] &&
                      first_tree.second[static_cast<std::size_t>(first_tree.root)] ==
                          second_tree.second[static_cast<std::size_t>(second_tree.root)];
    std::cout << (same ? "SAME\n" : "DIFFERENT\n");
    return 0;
}
