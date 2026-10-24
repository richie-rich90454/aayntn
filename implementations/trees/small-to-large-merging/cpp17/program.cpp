#include <cstddef>
#include <iostream>
#include <unordered_set>
#include <vector>

/**
 * The number of distinct colors in the subtree of every vertex, read from
 * standard input.
 *
 * Input: n, then n colors (0-based vertices), then the parents of vertices 1
 * through n-1. Every parent is smaller than its child, so vertex 0 is the root
 * and the vertices are listed in a topological order.
 * Output: n lines; line v holds the number of distinct colors in the subtree
 * of v.
 */
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n <= 0) {
        return 0;
    }

    std::vector<int> color(n, 0);
    for (int v = 0; v < n; v++) {
        std::cin >> color[v];
    }

    std::vector<int> parent(n, -1);
    for (int v = 1; v < n; v++) {
        int p = 0;
        std::cin >> p;
        /* The contract numbers parents before children; a bad index falls back to the root. */
        parent[v] = (p >= 0 && p < v) ? p : 0;
    }

    std::vector<std::unordered_set<int>> sets(n);
    std::vector<int> answer(n, 1);
    std::vector<int> weight(n, 1);
    for (int v = 0; v < n; v++) {
        sets[v].insert(color[v]);
    }

    /*
     * Every child has a larger index than its parent, so this reverse sweep is
     * a postorder: when v is reached, all of its children are already in its set.
     */
    for (int v = n - 1; v >= 1; v--) {
        answer[v] = static_cast<int>(sets[v].size());
        const int p = parent[v];
        /*
         * Keep the larger live component as the base and pour the smaller one
         * into it. The weight counts the vertices the component represents, so
         * the component that holds a moved element at least doubles.
         */
        if (weight[p] < weight[v]) {
            sets[p].swap(sets[v]);
            std::swap(weight[p], weight[v]);
        }
        for (int c : sets[v]) {
            sets[p].insert(c);
        }
        weight[p] += weight[v];
        sets[v].clear();
    }
    answer[0] = static_cast<int>(sets[0].size());

    for (int v = 0; v < n; v++) {
        std::cout << answer[v] << '\n';
    }
    return 0;
}
