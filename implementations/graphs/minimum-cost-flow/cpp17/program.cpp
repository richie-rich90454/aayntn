#include <bits/stdc++.h>

using namespace std;

const long long INF = 4000000000000000000LL;

struct Edge {
    int to;
    int rev;
    long long cap;
    long long cost;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    int m = 0;
    int s = 0;
    int t = 0;
    if (!(cin >> n >> m >> s >> t)) {
        return 0;
    }
    if (n <= 0 || s < 0 || s >= n || t < 0 || t >= n || s == t) {
        cout << "0 0\n";
        return 0;
    }
    if (m < 0) {
        m = 0;
    }

    vector<vector<Edge>> graph(n);
    for (int e = 0; e < m; e++) {
        int u = 0;
        int v = 0;
        long long cap = 0;
        long long cost = 0;
        if (!(cin >> u >> v >> cap >> cost)) {
            break;
        }
        if (u < 0 || u >= n || v < 0 || v >= n || cap < 0) {
            continue;
        }
        graph[u].push_back({v, static_cast<int>(graph[v].size()), cap, cost});
        graph[v].push_back({u, static_cast<int>(graph[u].size()) - 1, 0, -cost});
    }

    vector<long long> height(n, 0);
    vector<long long> distance(n);
    vector<int> previousVertex(n);
    vector<int> previousEdge(n);
    long long flow = 0;
    long long total = 0;

    for (;;) {
        fill(distance.begin(), distance.end(), INF);
        fill(previousVertex.begin(), previousVertex.end(), -1);
        fill(previousEdge.begin(), previousEdge.end(), -1);
        distance[s] = 0;
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> queue;
        queue.push({0, s});
        while (!queue.empty()) {
            const auto [current, v] = queue.top();
            queue.pop();
            if (current != distance[v]) {
                continue;
            }
            for (int i = 0; i < static_cast<int>(graph[v].size()); i++) {
                const Edge &edge = graph[v][i];
                if (edge.cap <= 0) {
                    continue;
                }
                // The reduced cost is nonnegative while the potentials are feasible.
                const long long candidate = current + edge.cost + height[v] - height[edge.to];
                if (candidate < distance[edge.to]) {
                    distance[edge.to] = candidate;
                    previousVertex[edge.to] = v;
                    previousEdge[edge.to] = i;
                    queue.push({candidate, edge.to});
                }
            }
        }
        if (distance[t] == INF) {
            break;
        }
        for (int v = 0; v < n; v++) {
            if (distance[v] < INF) {
                height[v] += distance[v];
            }
        }

        long long add = INF;
        for (int v = t; v != s; v = previousVertex[v]) {
            add = min(add, graph[previousVertex[v]][previousEdge[v]].cap);
        }
        for (int v = t; v != s; v = previousVertex[v]) {
            Edge &edge = graph[previousVertex[v]][previousEdge[v]];
            edge.cap -= add;
            graph[edge.to][edge.rev].cap += add;
        }
        flow += add;
        total += add * (height[t] - height[s]);
    }

    cout << flow << ' ' << total << '\n';
    return 0;
}
