"""Depth-first search that marks a vertex when it is popped from the stack.

Marking on pop rather than on push is what keeps the explicit stack faithful
to the recursive traversal, but it also lets a vertex be pushed once per
incident edge: the stack therefore holds up to O(V + E) entries, not O(V).
"""

import sys


def dfs_iterative(adj, source):
    """Return the vertices reachable from source, in the order they were visited.

    adj is an adjacency list: adj[v] lists the neighbors of the vertex v.
    """
    if source < 0 or source >= len(adj):
        return []

    visited = [False] * len(adj)
    stack = [source]
    order = []
    while stack:
        v = stack.pop()
        if visited[v]:
            # The vertex was already reached through another edge.
            continue
        visited[v] = True
        order.append(v)
        for w in adj[v]:
            if not visited[w]:
                stack.append(w)
    return order


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    if n <= 0:
        sys.stdout.write("0\n\n")
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

    order = dfs_iterative(adj, source)
    reachable = [False] * n
    for v in order:
        reachable[v] = True

    vertices = [str(v) for v in range(n) if reachable[v]]
    sys.stdout.write(str(len(order)) + "\n")
    sys.stdout.write(" ".join(vertices) + "\n")


if __name__ == "__main__":
    main()
