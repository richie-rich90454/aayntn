#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int q;
    if (!(std::cin >> q)) return 0;

    std::vector<int> value(q + 1, 0);
    std::vector<int> parent(q + 1, -1);
    std::vector<int> root(q + 1, -1);

    int nodes = 0;
    int versions = 0;

    for (int i = 0; i < q; ++i) {
        int type;
        int v;
        std::cin >> type >> v;

        if (type == 1) {
            int x;
            std::cin >> x;
            value[nodes] = x;
            parent[nodes] = root[v];
            ++versions;
            root[versions] = nodes;
            ++nodes;
        } else if (type == 2) {
            int old = root[v];
            ++versions;
            root[versions] = (old == -1) ? -1 : parent[old];
        } else {
            int top = root[v];
            std::cout << ((top == -1) ? -1 : value[top]) << '\n';
        }
    }

    return 0;
}
