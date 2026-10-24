"""Nearest-neighbor queries on a static two-dimensional point set.

Input: n, then n points, then q, then q query points. Output: for each query,
the 1-based index of the nearest input point by squared Euclidean distance,
with ties broken by the lowest index.

The tree splits alternately on x and y at the median, so every subtree is a
rectangle and the recursion has depth O(log n).
"""

import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return
    n = data[0]
    if n <= 0:
        return

    pts = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]
    at = 1 + 2 * n
    q = data[at]
    at += 1

    left = [-1] * n
    right = [-1] * n

    def build(ids, depth):
        if not ids:
            return -1
        axis = depth & 1
        ids.sort(key=lambda index: (pts[index][axis], index))
        mid = len(ids) // 2
        node = ids[mid]
        left[node] = build(ids[:mid], depth + 1)
        right[node] = build(ids[mid + 1 :], depth + 1)
        return node

    root = build(list(range(n)), 0)

    best_dist = 0
    best_index = -1

    def nearest(node, qx, qy, depth):
        nonlocal best_dist, best_index
        if node < 0:
            return
        dx = pts[node][0] - qx
        dy = pts[node][1] - qy
        d = dx * dx + dy * dy
        if best_index < 0 or d < best_dist or (d == best_dist and node < best_index):
            best_dist = d
            best_index = node

        axis = depth & 1
        delta = (qx - pts[node][0]) if axis == 0 else (qy - pts[node][1])
        if delta <= 0:
            near_child, far_child = left[node], right[node]
        else:
            near_child, far_child = right[node], left[node]

        nearest(near_child, qx, qy, depth + 1)
        # Equality is not pruned: a point at the same distance can have a lower index.
        if delta * delta <= best_dist:
            nearest(far_child, qx, qy, depth + 1)

    out = []
    for _ in range(q):
        qx = data[at]
        qy = data[at + 1]
        at += 2
        best_dist = 0
        best_index = -1
        nearest(root, qx, qy, 0)
        out.append(str(best_index + 1))

    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
