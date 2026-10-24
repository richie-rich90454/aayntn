"""Maximum-weight spanning forest by Kruskal's algorithm.

Input: n, m, then m triples u v w describing an undirected edge of weight w.
Output: the total weight of a maximum-weight spanning forest.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    m = int(data[1])
    edges = []
    index = 2
    for _ in range(m):
        if index + 2 >= len(data):
            break
        u = int(data[index]) - 1
        v = int(data[index + 1]) - 1
        weight = int(data[index + 2])
        index += 3
        edges.append((weight, u, v))

    if n < 1:
        sys.stdout.write("0\n")
        return

    edges.sort(reverse=True)
    parent = list(range(n))
    size = [1] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    total = 0
    for weight, u, v in edges:
        ru = find(u)
        rv = find(v)
        if ru == rv:
            continue
        if size[ru] < size[rv]:
            ru, rv = rv, ru
        parent[rv] = ru
        size[ru] += size[rv]
        total += weight

    sys.stdout.write(str(total) + "\n")


if __name__ == "__main__":
    main()
