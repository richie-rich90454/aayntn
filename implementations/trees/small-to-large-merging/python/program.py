"""The number of distinct colors in the subtree of every vertex.

Input: n, then n colors (0-based vertices), then the parents of vertices 1
through n-1. Every parent is smaller than its child, so vertex 0 is the root
and the vertices are listed in a topological order.
Output: n lines; line v holds the number of distinct colors in the subtree of v.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = max(0, int(data[0]))
    if n == 0:
        return

    colors = [int(value) for value in data[1 : 1 + n]]
    while len(colors) < n:
        colors.append(0)

    parent = [-1] * n
    index = 1 + n
    for v in range(1, n):
        value = int(data[index]) if index < len(data) else 0
        index += 1
        # The contract numbers parents before children; a bad index falls back to the root.
        parent[v] = value if 0 <= value < v else 0

    sets = [{color} for color in colors]
    answer = [1] * n
    weight = [1] * n

    # Every child has a larger index than its parent, so this reverse sweep is
    # a postorder: when v is reached, all of its children are already in its set.
    for v in range(n - 1, 0, -1):
        answer[v] = len(sets[v])
        p = parent[v]
        # Keep the larger live component as the base and pour the smaller one
        # into it. The weight counts the vertices the component represents, so
        # the component that holds a moved element at least doubles.
        if weight[p] < weight[v]:
            sets[p], sets[v] = sets[v], sets[p]
            weight[p], weight[v] = weight[v], weight[p]
        sets[p].update(sets[v])
        weight[p] += weight[v]
        sets[v].clear()

    answer[0] = len(sets[0])
    sys.stdout.buffer.write(("\n".join(map(str, answer)) + "\n").encode())


if __name__ == "__main__":
    main()
