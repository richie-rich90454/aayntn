"""The sum of the values on a path of a tree, driven from standard input.

Input: n m, then m lines u v (0-based, undirected), then q, then q lines u v
with the queried pair of vertices.
Output: one line per query, holding the sum of the values of the vertices on
the path, both endpoints included. The value of the vertex i is i + 1.
"""

import sys


class Hld:
    """A heavy-light decomposition of a tree rooted at one vertex.

    size[v] is the number of vertices in the subtree of v, heavy[v] is the
    child of v with the largest subtree, head[v] is the top of the chain of v
    and pos[v] is its index in the flattened array.

    The instance owns its lists, so the decomposition is reclaimed with the
    object.
    """

    def __init__(self, adj, root, values):
        """Build the decomposition of the tree whose adjacency list is adj.

        adj[v] lists the neighbors of the vertex v and values[v] is the value
        of the vertex v.
        """
        self.n = len(adj)
        self.parent = [0] * self.n
        self.depth = [-1] * self.n
        self.size = [1] * self.n
        self.heavy = [-1] * self.n
        self.head = [0] * self.n
        self.pos = [0] * self.n
        self.flat = [0] * self.n
        self.prefix = [0] * (self.n + 1)
        if self.n <= 0 or root < 0 or root >= self.n:
            return

        # A breadth-first walk from the root fixes the parents and the depths.
        self.parent[root] = root
        self.depth[root] = 0
        order = [root]
        head = 0
        while head < len(order):
            u = order[head]
            head += 1
            for w in adj[u]:
                if self.depth[w] != -1:
                    # The vertex was already reached through another edge.
                    continue
                self.depth[w] = self.depth[u] + 1
                self.parent[w] = u
                order.append(w)

        # The subtree sizes are known from the leaves upwards, and the heavy
        # child of a vertex is the child with the largest subtree.
        for u in reversed(order):
            for w in adj[u]:
                if w == u or self.parent[w] != u:
                    # The vertex is not a child of u.
                    continue
                self.size[u] += self.size[w]
                current = self.heavy[u]
                if current == -1 or self.size[w] > self.size[current]:
                    self.heavy[u] = w

        # The flattened array holds one chain after the other, so the vertices
        # of a chain occupy a contiguous range of indices.
        timer = 0
        for v in order:
            if v != root and self.heavy[self.parent[v]] == v:
                # The vertex continues the chain of its parent.
                continue
            u = v
            while u != -1:
                self.head[u] = v
                self.pos[u] = timer
                self.flat[timer] = values[u]
                timer += 1
                u = self.heavy[u]

        # The prefix sums turn every chain segment into a single subtraction,
        # so a path query costs one step per chain instead of a segment tree
        # walk.
        for i in range(self.n):
            self.prefix[i + 1] = self.prefix[i] + self.flat[i]

    def path_sum(self, u, v):
        """The sum of the values of the vertices on the path from u to v."""
        if u < 0 or u >= self.n or v < 0 or v >= self.n:
            return 0
        if self.depth[u] < 0 or self.depth[v] < 0:
            # A vertex outside the component of the root lies on no path.
            return 0

        total = 0
        while self.head[u] != self.head[v]:
            if self.depth[self.head[u]] < self.depth[self.head[v]]:
                u, v = v, u
            # The chain of u is a contiguous range of the flattened array.
            top = self.head[u]
            total += self.prefix[self.pos[u] + 1] - self.prefix[self.pos[top]]
            u = self.parent[top]
        if self.depth[u] > self.depth[v]:
            u, v = v, u
        total += self.prefix[self.pos[v] + 1] - self.prefix[self.pos[u]]
        return total


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    m = max(0, int(data[1]))

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

    # The value of the vertex i is i + 1, so the vertex 0 has the value 1.
    hld = Hld(adj, 0, [v + 1 for v in range(n)])

    q = 0
    if index < len(data):
        q = int(data[index])
        index += 1
    lines = []
    for _ in range(q):
        if index + 1 >= len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        index += 2
        lines.append(str(hld.path_sum(u, v)))

    if lines:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
