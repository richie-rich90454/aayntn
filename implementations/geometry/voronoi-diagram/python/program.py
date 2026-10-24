"""Nearest-site queries on a static set of points.

The program answers the defining query directly and does not build the full
Voronoi diagram. Input: n and q, then n points, then q query points. Output:
for each query, the 1-based index of the nearest point by squared Euclidean
distance, with ties broken by the lowest index.
"""

import sys


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return
    n = data[0]
    q = data[1]
    if n <= 0:
        return

    sites = [(data[2 + 2 * i], data[3 + 2 * i]) for i in range(n)]
    at = 2 + 2 * n
    out = []

    for _ in range(q):
        if at + 1 >= len(data):
            break
        qx = data[at]
        qy = data[at + 1]
        at += 2

        best = 0
        best_index = -1
        for i, (x, y) in enumerate(sites):
            dx = x - qx
            dy = y - qy
            d = dx * dx + dy * dy
            if best_index < 0 or d < best or (d == best and i < best_index):
                best = d
                best_index = i
        out.append(str(best_index + 1))

    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
