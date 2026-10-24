"""Shortest path by iterative deepening, with the number of expanded vertices.

Input: n m s t, then m undirected edges u v.
Output: one line holding the shortest distance and the total expansions.
"""

import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 4:
        return
    n, m, start, target = data[0], data[1], data[2], data[3]

    adjacency = [[] for _ in range(n + 1)]
    position = 4
    for _ in range(m):
        u, v = data[position], data[position + 1]
        position += 2
        adjacency[u].append(v)
        adjacency[v].append(u)

    sys.setrecursionlimit(max(1000, n + 10))
    on_path = [False] * (n + 1)
    expanded = 0

    def depth_limited_search(vertex, depth, limit):
        nonlocal expanded
        on_path[vertex] = True
        expanded += 1
        if vertex == target:
            return True
        if depth == limit:
            on_path[vertex] = False
            return False
        for neighbor in adjacency[vertex]:
            if not on_path[neighbor] and depth_limited_search(neighbor, depth + 1, limit):
                return True
        on_path[vertex] = False
        return False

    answer = -1
    for limit in range(n):
        on_path[:] = [False] * (n + 1)
        if depth_limited_search(start, 0, limit):
            answer = limit
            break

    print(answer, expanded)


if __name__ == "__main__":
    main()
