"""The total weight of the virtual tree of the marked vertices of a tree.

Input: n m, then m lines u v w with 0-based undirected weighted edges, then q,
then q lines k a1 ... ak with the marked vertices.
Output: one line per query with the total weight of the virtual tree's edges.
The root is the vertex 0, duplicate marks count once, and a mark outside the
tree or outside the root's component is ignored.
"""

import sys
from array import array


class Tree:
    """Ancestor table, preorder intervals and weighted root distances."""

    def __init__(self, adj):
        self.n = len(adj)
        levels = 1
        while (1 << levels) <= self.n:
            levels += 1
        self.levels = levels
        n = self.n
        self.parent = [-1] * n
        self.depth = [-1] * n
        self.tin = [-1] * n
        self.tout = [-1] * n
        self.distance = [0] * n
        self.up = array("i", [0]) * (levels * n)
        if n <= 0:
            return

        cursor = [0] * n
        stack = [0]
        self.parent[0] = 0
        self.depth[0] = 0
        self.tin[0] = 0
        timer = 1
        while stack:
            v = stack[-1]
            edges = adj[v]
            e = cursor[v]
            while e < len(edges) and self.parent[edges[e][0]] != -1:
                e += 1
            cursor[v] = e
            if e == len(edges):
                self.tout[v] = timer
                stack.pop()
                continue
            cursor[v] = e + 1
            u, w = edges[e]
            self.parent[u] = v
            self.depth[u] = self.depth[v] + 1
            self.distance[u] = self.distance[v] + w
            self.tin[u] = timer
            timer += 1
            stack.append(u)

        # The root is its own ancestor, so every entry of the table is defined.
        for v in range(n):
            self.up[v] = self.parent[v] if self.parent[v] >= 0 else v
        for k in range(1, levels):
            previous = (k - 1) * n
            current = k * n
            for v in range(n):
                self.up[current + v] = self.up[previous + self.up[previous + v]]

    def lca(self, u, v):
        """The lowest common ancestor of u and v, or -1 outside the tree."""
        if u < 0 or u >= self.n or v < 0 or v >= self.n:
            return -1
        if self.depth[u] < 0 or self.depth[v] < 0:
            return -1
        if self.depth[u] < self.depth[v]:
            u, v = v, u
        difference = self.depth[u] - self.depth[v]
        k = 0
        while difference:
            if difference & 1:
                u = self.up[k * self.n + u]
            difference >>= 1
            k += 1
        if u == v:
            return u
        for k in range(self.levels - 1, -1, -1):
            ancestor_u = self.up[k * self.n + u]
            ancestor_v = self.up[k * self.n + v]
            if ancestor_u != ancestor_v:
                u, v = ancestor_u, ancestor_v
        return self.up[u]

    def is_ancestor(self, u, v):
        """Whether u lies on the path from the root to v."""
        return self.tin[u] <= self.tin[v] < self.tout[u]


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return
    position = 0
    n = max(0, int(data[position]))
    position += 1
    m = max(0, int(data[position]))
    position += 1

    adj = [[] for _ in range(n)]
    for _ in range(m):
        if position + 2 >= len(data):
            break
        u = int(data[position])
        v = int(data[position + 1])
        w = int(data[position + 2])
        position += 3
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        adj[u].append((v, w))
        adj[v].append((u, w))

    tree = Tree(adj)

    q = 0
    if position < len(data):
        q = max(0, int(data[position]))
        position += 1

    stamp = [0] * n
    marks = []
    nodes = []
    stack = []
    out = []
    for query in range(q):
        if position >= len(data):
            break
        k = max(0, int(data[position]))
        position += 1
        query_id = query + 1
        marks.clear()
        complete = True
        for _ in range(k):
            if position >= len(data):
                complete = False
                break
            v = int(data[position])
            position += 1
            if 0 <= v < n and tree.depth[v] >= 0 and stamp[v] != query_id:
                stamp[v] = query_id
                marks.append(v)
        if not complete:
            break
        if len(marks) < 2:
            out.append("0")
            continue

        marks.sort(key=tree.tin.__getitem__)
        nodes[:] = marks
        for i in range(len(marks) - 1):
            ancestor = tree.lca(marks[i], marks[i + 1])
            if ancestor >= 0:
                nodes.append(ancestor)
        nodes.sort(key=tree.tin.__getitem__)

        unique = 0
        for i in range(len(nodes)):
            if unique == 0 or nodes[i] != nodes[unique - 1]:
                nodes[unique] = nodes[i]
                unique += 1
        del nodes[unique:]

        total = 0
        stack.clear()
        for v in nodes:
            while stack and not tree.is_ancestor(stack[-1], v):
                stack.pop()
            if stack:
                total += tree.distance[v] - tree.distance[stack[-1]]
            stack.append(v)
        out.append(str(total))

    if out:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(("\n".join(out) + "\n").encode())


if __name__ == "__main__":
    main()
