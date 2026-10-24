#include <algorithm>
#include <iostream>
#include <vector>

static std::vector<std::vector<int>> adjacency;
static std::vector<char> onPath;
static long long expanded;
static int target;

static bool depthLimitedSearch(int vertex, int depth, int limit) {
    onPath[vertex] = 1;
    ++expanded;
    if (vertex == target) {
        return true;
    }
    if (depth == limit) {
        onPath[vertex] = 0;
        return false;
    }
    for (int neighbor : adjacency[vertex]) {
        if (!onPath[neighbor] && depthLimitedSearch(neighbor, depth + 1, limit)) {
            return true;
        }
    }
    onPath[vertex] = 0;
    return false;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    int m;
    int start;
    if (!(std::cin >> n >> m >> start >> target)) {
        return 0;
    }
    if (n < 1 || m < 0 || start < 1 || start > n || target < 1 || target > n) {
        return 0;
    }

    adjacency.assign(n + 1, {});
    for (int i = 0; i < m; ++i) {
        int u;
        int v;
        if (!(std::cin >> u >> v) || u < 1 || u > n || v < 1 || v > n) {
            return 0;
        }
        adjacency[u].push_back(v);
        adjacency[v].push_back(u);
    }

    onPath.assign(n + 1, 0);
    int answer = -1;
    for (int limit = 0; limit < n; ++limit) {
        std::fill(onPath.begin(), onPath.end(), 0);
        if (depthLimitedSearch(start, 0, limit)) {
            answer = limit;
            break;
        }
    }

    std::cout << answer << ' ' << expanded << '\n';
    return 0;
}
