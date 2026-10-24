#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

/*
 * Suffix tree of s + '$', built by inserting every suffix and splitting an
 * edge when two suffixes diverge inside it.  Every node stores the start and
 * the length of its incoming edge, so the edge labels are substrings of the
 * input rather than copies.
 */

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;
    if (!std::getline(std::cin, s)) return 0;
    if (!s.empty() && s.back() == '\r') s.pop_back();

    const std::string t = s + '$';
    const int N = static_cast<int>(t.size());
    const int cap = 2 * N + 2;

    std::vector<int> child(static_cast<size_t>(cap) * 27, -1);
    std::vector<int> edgeStart(cap, 0);
    std::vector<int> edgeLen(cap, 0);
    std::vector<int> depth(cap, 0);
    std::vector<int> childCount(cap, 0);

    int size = 1;
    for (int i = 0; i < N; ++i) {
        int v = 0;
        int pos = i;
        for (;;) {
            const int c = t[pos] == '$' ? 26 : t[pos] - 'a';
            const int u = child[v * 27 + c];
            if (u == -1) {
                const int leaf = size++;
                edgeStart[leaf] = pos;
                edgeLen[leaf] = N - pos;
                depth[leaf] = depth[v] + edgeLen[leaf];
                child[v * 27 + c] = leaf;
                ++childCount[v];
                break;
            }

            const int maxl = std::min(edgeLen[u], N - pos);
            int l = 0;
            while (l < maxl && t[edgeStart[u] + l] == t[pos + l]) ++l;

            if (l == edgeLen[u]) {
                v = u;
                pos += l;
                if (pos == N) break;
            } else {
                const int w = size++;
                child[v * 27 + c] = w;
                edgeStart[w] = edgeStart[u];
                edgeLen[w] = l;
                depth[w] = depth[v] + l;

                int code = t[edgeStart[u] + l] == '$' ? 26 : t[edgeStart[u] + l] - 'a';
                child[w * 27 + code] = u;
                ++childCount[w];
                edgeStart[u] += l;
                edgeLen[u] -= l;

                const int leaf = size++;
                edgeStart[leaf] = pos + l;
                edgeLen[leaf] = N - (pos + l);
                depth[leaf] = depth[w] + edgeLen[leaf];
                code = t[pos + l] == '$' ? 26 : t[pos + l] - 'a';
                child[w * 27 + code] = leaf;
                ++childCount[w];
                break;
            }
        }
    }

    long long total = 0;
    int best = 0;
    for (int v = 1; v < size; ++v) {
        total += edgeLen[v];
        if (childCount[v] >= 2 && depth[v] > best) best = depth[v];
    }

    std::cout << total - static_cast<long long>(N) << '\n' << best << '\n';
    return 0;
}
