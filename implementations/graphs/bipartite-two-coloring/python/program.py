"""The two-coloring test for an undirected graph read from standard input.

Input: n m, then m lines u v (0-based, undirected).
Output: the color of every vertex, 0 or 1, separated by spaces, or the single
line -1 when the graph is not bipartite.
"""

import sys


def two_color(adj):
    """Return the colors of a bipartite graph, or None when it is not bipartite.

    A vertex receives the opposite color of the vertex that discovered it, so
    its color is the parity of its breadth-first distance from the root of its
    component. The test fails when an edge joins two vertices of the same
    parity, because that edge closes an odd cycle.
    """
    n = len(adj)
    color = [-1] * n
    queue = []

    for s in range(n):
        if color[s] != -1:
            # This component was already colored.
            continue
        color[s] = 0
        queue.append(s)
        head = 0
        while head < len(queue):
            u = queue[head]
            head += 1
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = color[u] ^ 1
                    queue.append(v)
                elif color[v] == color[u]:
                    # The edge closes an odd cycle.
                    return None
        queue.clear()
    return color


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
        if index + 1 >= len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        index += 2
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        adj[u].append(v)
        adj[v].append(u)

    color = two_color(adj)
    if color is None:
        sys.stdout.write("-1\n")
    else:
        sys.stdout.write(" ".join(str(c) for c in color) + "\n")


if __name__ == "__main__":
    main()
