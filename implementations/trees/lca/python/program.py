"""The lowest common ancestor of two vertices of a tree, by binary lifting.

Input: n m, then m lines u v (0-based, undirected), then q, then q lines u v
with the queried pair of vertices.
Output: one line per query, holding the index of the lowest common ancestor.
"""

import sys


class Lca:
    """A binary-lifting table for a tree rooted at one vertex.

    up[k * n + v] is the ancestor of v that lies 2^k edges above it, and
    depth[v] is the number of edges from the root to v.

    The instance owns its lists, so the table is reclaimed with the object.
    """

    def __init__(self, adj, root):
        """Build the table of the tree whose adjacency list is adj.

        adj[v] lists the neighbours of the vertex v.
        """
        self.n = len(adj)
        levels = 1
        while (1 << levels) <= self.n:
            levels += 1
        self.levels = levels
        self.depth = [-1] * self.n
        self.up = [0] * (levels * self.n)
        if self.n <= 0 or root < 0 or root >= self.n:
            return

        # The root is its own ancestor, so the table stays defined everywhere.
        self.up[root] = root
        self.depth[root] = 0

        queue = [root]
        head = 0
        while head < len(queue):
            u = queue[head]
            head += 1
            for w in adj[u]:
                if self.depth[w] != -1:
                    # The vertex was already reached through another edge.
                    continue
                self.depth[w] = self.depth[u] + 1
                self.up[w] = u
                queue.append(w)

        # The table of the 2^k ancestors is built from the table of the 2^(k-1).
        for k in range(1, levels):
            previous = (k - 1) * self.n
            current = k * self.n
            for v in range(self.n):
                self.up[current + v] = self.up[previous + self.up[previous + v]]

    def query(self, u, v):
        """The lowest common ancestor of u and v."""
        if u < 0 or u >= self.n or v < 0 or v >= self.n:
            return -1
        if self.depth[u] < 0 or self.depth[v] < 0:
            # A vertex outside the component of the root has no ancestor.
            return -1
        if self.depth[u] < self.depth[v]:
            u, v = v, u

        # Lift the deeper vertex until both stand at the same depth.
        difference = self.depth[u] - self.depth[v]
        k = 0
        while difference:
            if difference & 1:
                u = self.up[k * self.n + u]
            difference >>= 1
            k += 1
        if u == v:
            return u

        # From the largest jump downwards, the two vertices either stay
        # together or they both move one step below the common ancestor.
        for k in range(self.levels - 1, -1, -1):
            ancestor_u = self.up[k * self.n + u]
            ancestor_v = self.up[k * self.n + v]
            if ancestor_u != ancestor_v:
                u, v = ancestor_u, ancestor_v
        return self.up[u]


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

    lca = Lca(adj, 0)

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
        lines.append(str(lca.query(u, v)))

    if lines:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
