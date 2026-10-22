"""Breadth-first search over an undirected graph read from standard input.

Input: n m, then m lines u v (0-based, undirected), then the start vertex.
Output: the distance from the start vertex to every vertex, separated by
spaces, and -1 for the vertices the start cannot reach.
"""

import sys


def bfs_distances(adj, source):
    """Return the distance from source to every vertex, -1 when unreachable.

    The queue holds the frontier, so the vertices leave it in order of
    increasing distance from source: the first time a vertex is discovered
    its distance is already the length of a shortest path to it. adj is an
    adjacency list: adj[v] lists the neighbors of the vertex v.
    """
    distance = [-1] * len(adj)
    if source < 0 or source >= len(adj):
        return distance

    queue = [source]
    head = 0
    distance[source] = 0
    while head < len(queue):
        v = queue[head]
        head += 1
        for w in adj[v]:
            if distance[w] >= 0:
                # The vertex was already discovered.
                continue
            distance[w] = distance[v] + 1
            queue.append(w)
    return distance


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    if n <= 0:
        sys.stdout.write("\n")
        return

    adj = [[] for _ in range(n)]
    index = 2
    for _ in range(m):
        if index >= len(data):
            break
        u = int(data[index])
        index += 1
        if index >= len(data):
            break
        v = int(data[index])
        index += 1
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        adj[u].append(v)
        adj[v].append(u)
    source = int(data[index]) if index < len(data) else -1

    distance = bfs_distances(adj, source)
    sys.stdout.write(" ".join(str(d) for d in distance) + "\n")


if __name__ == "__main__":
    main()
