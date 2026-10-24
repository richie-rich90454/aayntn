"""Johnson's algorithm over a directed weighted graph read from standard input.

Input: n m, then m lines u v w (0-based, directed, integer weight). The input
ends after the edges.
Output: n lines of n integers, where the j-th number of the i-th line is the
shortest distance from i to j, and -1 when j is unreachable from i. A graph
with a negative cycle prints the single line "NEGATIVE CYCLE" instead.
"""

import heapq
import sys

# Larger than any shortest path this program can build from two finite values,
# so the guarded addition below cannot overflow the arithmetic.
INFINITY = 4 * 10**18


def bellman_ford(n, edges):
    """Return the potentials of the graph, or None when a negative cycle exists.

    Every vertex starts at zero, as if a virtual source were joined to it by an
    edge of weight zero. The potentials are the shortest distances from that
    virtual source, so the reduced weight of every edge is nonnegative.
    """
    height = [0] * n
    for pass_index in range(n):
        changed = False
        for u, v, w in edges:
            candidate = height[u] + w
            if candidate < height[v]:
                height[v] = candidate
                changed = True
        if not changed:
            return height
        if pass_index == n - 1:
            return None
    return height


def dijkstra(n, adjacency, source):
    """Shortest distances from the source in the reweighted graph."""
    distance = [INFINITY] * n
    distance[source] = 0
    heap = [(0, source)]
    while heap:
        current, v = heapq.heappop(heap)
        if current != distance[v]:
            continue
        for to, weight in adjacency[v]:
            candidate = current + weight
            if candidate < distance[to]:
                distance[to] = candidate
                heapq.heappush(heap, (candidate, to))
    return distance


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    if n <= 0:
        sys.stdout.buffer.write(b"\n")
        return
    if m < 0:
        m = 0

    edges = []
    index = 2
    for _ in range(m):
        if index + 2 >= len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        w = int(data[index + 2])
        index += 3
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        edges.append((u, v, w))

    height = bellman_ford(n, edges)
    if height is None:
        sys.stdout.buffer.write(b"NEGATIVE CYCLE\n")
        return

    adjacency = [[] for _ in range(n)]
    for u, v, w in edges:
        # The reduced weight is nonnegative: height[v] <= height[u] + w.
        adjacency[u].append((v, w + height[u] - height[v]))

    lines = []
    for source in range(n):
        distance = dijkstra(n, adjacency, source)
        row = []
        for v in range(n):
            if distance[v] == INFINITY:
                row.append("-1")
            else:
                row.append(str(distance[v] - height[source] + height[v]))
        lines.append(" ".join(row))
    sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
