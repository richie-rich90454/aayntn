"""Minimum-cost maximum flow in a directed network read from standard input.

Input: n m s t, then m lines u v capacity cost (0-based, directed).
Output: the maximum flow and the minimum cost of that flow.
"""

import heapq
import sys

INF = 10**30


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 4:
        return
    n, m, s, t = data[0], data[1], data[2], data[3]
    if n <= 0 or not 0 <= s < n or not 0 <= t < n or s == t:
        print("0 0")
        return

    graph = [[] for _ in range(n)]
    index = 4
    for _ in range(m):
        if index + 3 >= len(data):
            break
        u, v, capacity, cost = data[index : index + 4]
        index += 4
        if not 0 <= u < n or not 0 <= v < n or capacity < 0:
            continue
        graph[u].append([v, capacity, cost, len(graph[v])])
        graph[v].append([u, 0, -cost, len(graph[u]) - 1])

    height = [0] * n
    flow = 0
    total = 0

    while True:
        distance = [INF] * n
        previous_vertex = [-1] * n
        previous_edge = [-1] * n
        distance[s] = 0
        queue = [(0, s)]
        while queue:
            current, v = heapq.heappop(queue)
            if current != distance[v]:
                continue
            for i, (to, capacity, cost, _) in enumerate(graph[v]):
                if capacity <= 0:
                    continue
                # The reduced cost is nonnegative while the potentials are feasible.
                candidate = current + cost + height[v] - height[to]
                if candidate < distance[to]:
                    distance[to] = candidate
                    previous_vertex[to] = v
                    previous_edge[to] = i
                    heapq.heappush(queue, (candidate, to))
        if distance[t] == INF:
            break
        for v in range(n):
            if distance[v] < INF:
                height[v] += distance[v]

        add = INF
        v = t
        while v != s:
            add = min(add, graph[previous_vertex[v]][previous_edge[v]][1])
            v = previous_vertex[v]
        v = t
        while v != s:
            edge = graph[previous_vertex[v]][previous_edge[v]]
            edge[1] -= add
            graph[edge[0]][edge[3]][1] += add
            v = previous_vertex[v]
        flow += add
        total += add * (height[t] - height[s])

    print(flow, total)


if __name__ == "__main__":
    main()
