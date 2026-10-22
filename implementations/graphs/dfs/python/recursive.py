"""Depth-first search that marks a vertex on entry to the recursive call.

Every vertex is entered at most once, so the auxiliary space is the visited
array plus one stack frame per vertex on the current path: O(V) in total. The
call stack can grow to the depth of the graph, which overflows in C++ and Java
on a long chain.
"""

import sys

# The recursion depth equals the depth of the graph, so the interpreter limit
# has to be lifted above the default of 1000 frames.
sys.setrecursionlimit(10000)


def dfs_recursive(adj, source):
    """Return the vertices reachable from source, in the order they were visited.

    adj is an adjacency list: adj[v] lists the neighbors of the vertex v.
    """
    if source < 0 or source >= len(adj):
        return []

    visited = [False] * len(adj)
    order = []

    def visit(v):
        visited[v] = True
        order.append(v)
        for w in adj[v]:
            if not visited[w]:
                visit(w)

    visit(source)
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

    order = dfs_recursive(adj, source)
    reachable = [False] * n
    for v in order:
        reachable[v] = True

    vertices = [str(v) for v in range(n) if reachable[v]]
    sys.stdout.write(str(len(order)) + "\n")
    sys.stdout.write(" ".join(vertices) + "\n")


if __name__ == "__main__":
    main()
