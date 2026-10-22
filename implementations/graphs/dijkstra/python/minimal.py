"""Dijkstra's algorithm over a graph whose edge weights are all nonnegative.

The heap holds (distance, vertex) pairs and an entry is never removed from the
middle of the heap: a shorter path to a vertex pushes a second entry and the
stale one is discarded when it surfaces. That replaces a decrease-key operation
by at most one extra entry per successful relaxation, so the heap holds O(E)
entries.
"""

import heapq


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


def _self_check():
    """Assert the documented contract; the function above is the reusable part."""
    graph = [
        [(1, 4), (2, 2)],
        [(0, 4), (2, 1)],
        [(0, 2), (1, 1), (3, 8)],
        [(2, 8)],
        [],
    ]
    assert dijkstra(graph, 0) == [0, 3, 2, 10, -1]
    # The start vertex is the only one reachable from an isolated vertex.
    assert dijkstra(graph, 4) == [-1, -1, -1, -1, 0]
    # A start vertex outside the graph leaves every distance unknown.
    assert dijkstra(graph, 5) == [-1, -1, -1, -1, -1]


if __name__ == "__main__":
    _self_check()
