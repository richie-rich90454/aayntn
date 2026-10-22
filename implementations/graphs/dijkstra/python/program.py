"""Dijkstra's algorithm over an undirected weighted graph read from standard input.

Input: n m, then m lines u v w (0-based, undirected, nonnegative weight), then
the start vertex.
Output: the distance from the start vertex to every vertex, separated by
spaces, and -1 for the vertices the start cannot reach.
"""

import heapq
import sys


def dijkstra(adj, source):
    """Return the distance from source to every vertex, -1 when unreachable.

    adj is an adjacency list: adj[v] lists the (neighbor, weight) pairs of the
    edges incident to v.
    """
    distance = [-1] * len(adj)
    if source < 0 or source >= len(adj):
        return distance

    heap = [(0, source)]
    distance[source] = 0
    while heap:
        current, v = heapq.heappop(heap)
        if current != distance[v]:
            # A shorter path was found after this entry was pushed.
            continue
        for w, weight in adj[v]:
            candidate = current + weight
            if distance[w] >= 0 and candidate >= distance[w]:
                # The relaxation would not improve the distance.
                continue
            distance[w] = candidate
            heapq.heappush(heap, (candidate, w))
    return distance


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    if n <= 0:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(b"\n")
        return
    if m < 0:
        m = 0

    adj = [[] for _ in range(n)]
    index = 2
    for _ in range(m):
        if index + 2 >= len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        w = int(data[index + 2])
        index += 3
        if u < 0 or u >= n or v < 0 or v >= n or w < 0:
            continue
        adj[u].append((v, w))
        adj[v].append((u, w))
    source = int(data[index]) if index < len(data) else -1

    distance = dijkstra(adj, source)
    sys.stdout.buffer.write((" ".join(str(d) for d in distance) + "\n").encode())


if __name__ == "__main__":
    main()
