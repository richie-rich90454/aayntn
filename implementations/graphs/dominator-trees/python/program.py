"""Dominator tree of a directed graph, read from standard input.

The algorithm is the iterative dataflow version of Cooper, Harvey and Kennedy,
not Lengauer-Tarjan. Vertices are visited in reverse postorder of a depth-first
search from the source, and the immediate dominator of a vertex is the
intersection of the immediate dominators of its predecessors. The intersection
climbs the partially built dominator tree, and the passes repeat until no
immediate dominator changes.

Input: n m s, then m lines u v (0-based, directed).
Output: the immediate dominator of every vertex in index order. The source
prints 0, and a vertex the source cannot reach prints -1.
"""

import sys


def intersect(a, b, idom, order):
    """The common ancestor of a and b in the partially built dominator tree."""
    while a != b:
        while order[a] > order[b]:
            a = idom[a]
        while order[b] > order[a]:
            b = idom[b]
    return a


def dominators(adj, pred, source):
    """Return the immediate dominator of every vertex, or -1 when unreachable.

    adj is the successor list and pred the predecessor list. A vertex the
    source cannot reach keeps -1; the source is its own immediate dominator.
    """
    n = len(adj)
    idom = [-1] * n
    if source < 0 or source >= n:
        return idom

    # Iterative depth-first search: finish a vertex only after every successor
    # has been examined, then reverse the finishing order to obtain the
    # reverse postorder.
    visited = [False] * n
    next_edge = [0] * n
    postorder = []
    stack = [source]
    visited[source] = True
    while stack:
        v = stack[-1]
        if next_edge[v] < len(adj[v]):
            w = adj[v][next_edge[v]]
            next_edge[v] += 1
            if not visited[w]:
                visited[w] = True
                stack.append(w)
        else:
            postorder.append(v)
            stack.pop()
    order = [-1] * n
    rpo = postorder[::-1]
    for position, v in enumerate(rpo):
        order[v] = position

    idom[source] = source
    changed = True
    while changed:
        changed = False
        for v in rpo[1:]:
            candidate = -1
            for p in pred[v]:
                if idom[p] == -1:
                    continue
                if candidate == -1:
                    candidate = p
                else:
                    candidate = intersect(p, candidate, idom, order)
            if candidate != -1 and idom[v] != candidate:
                idom[v] = candidate
                changed = True
    return idom


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    source = int(data[2]) if len(data) > 2 else -1
    if n <= 0:
        # The language variants must agree byte for byte, so the line feed is
        # written as a byte and not translated by the text layer of Windows.
        sys.stdout.buffer.write(b"\n")
        return
    if m < 0:
        m = 0

    adj = [[] for _ in range(n)]
    pred = [[] for _ in range(n)]
    index = 3
    for _ in range(m):
        if index + 2 > len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        index += 2
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        adj[u].append(v)
        pred[v].append(u)

    idom = dominators(adj, pred, source)
    answer = []
    for v in range(n):
        if v == source:
            answer.append("0")
        elif idom[v] == -1:
            answer.append("-1")
        else:
            answer.append(str(idom[v]))
    sys.stdout.buffer.write((" ".join(answer) + "\n").encode())


if __name__ == "__main__":
    main()
