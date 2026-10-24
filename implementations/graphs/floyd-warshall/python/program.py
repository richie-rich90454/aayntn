"""Floyd-Warshall over a directed weighted graph read from standard input.

Input: n m, then m lines u v w (0-based, directed, integer weight). The input
ends after the edges.
Output: n lines of n integers, where the j-th number of the i-th line is the
shortest distance from i to j, and -1 when j is unreachable from i. A graph
with a negative cycle prints the single line "negative cycle" instead.
"""

import sys

# Larger than any shortest path this program can build from two finite values,
# so the guarded addition below cannot overflow the arithmetic.
INFINITY = 4 * 10**18


def floyd_warshall(distance, n):
    """Relax every pair through every possible intermediate vertex."""
    for k in range(n):
        row_k = distance[k]
        for i in range(n):
            row_i = distance[i]
            through = row_i[k]
            if through == INFINITY:
                continue
            for j in range(n):
                rest = row_k[j]
                if rest == INFINITY:
                    continue
                candidate = through + rest
                if candidate < row_i[j]:
                    row_i[j] = candidate


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    if n <= 0:
        sys.stdout.buffer.write(b"\n")
        return
    if m < 0:
        m = 0

    distance = [[INFINITY] * n for _ in range(n)]
    for v in range(n):
        distance[v][v] = 0

    index = 2
    for _ in range(m):
        if index + 2 >= len(data):
            break
        u = int(data[index])
        v = int(data[index + 1])
        w = int(data[index + 2])
        index += 3
        if u < 0 or u >= n or v < 0 or v >= n:
            continue
        if w < distance[u][v]:
            # Parallel edges are allowed, and only the cheaper one matters.
            distance[u][v] = w

    floyd_warshall(distance, n)

    for v in range(n):
        if distance[v][v] < 0:
            sys.stdout.buffer.write(b"negative cycle\n")
            return

    lines = []
    for i in range(n):
        lines.append(" ".join(str(-1 if value == INFINITY else value) for value in distance[i]))
    sys.stdout.buffer.write(("\n".join(lines) + "\n").encode())


if __name__ == "__main__":
    main()
