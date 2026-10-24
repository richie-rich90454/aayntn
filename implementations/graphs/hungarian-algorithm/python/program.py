"""The Hungarian algorithm for the assignment problem.

Input: n, then an n by n matrix of integer costs.
Output: the minimum total cost, then a 0-based permutation that assigns
each row to a column.
"""

import sys


def hungarian(cost):
    n = len(cost)
    u = [0] * (n + 1)
    v = [0] * (n + 1)
    p = [0] * (n + 1)
    way = [0] * (n + 1)
    infinity = float("inf")

    # Row minima are feasible dual potentials for costs of either sign.
    for i in range(1, n + 1):
        u[i] = min(cost[i - 1])

    for i in range(1, n + 1):
        p[0] = i
        j0 = 0
        minv = [infinity] * (n + 1)
        used = [False] * (n + 1)
        while True:
            used[j0] = True
            i0 = p[j0]
            delta = infinity
            j1 = 0
            for j in range(1, n + 1):
                if not used[j]:
                    cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
                    if cur < minv[j]:
                        minv[j] = cur
                        way[j] = j0
                    if minv[j] < delta:
                        delta = minv[j]
                        j1 = j
            for j in range(n + 1):
                if used[j]:
                    u[p[j]] += delta
                    v[j] -= delta
                else:
                    minv[j] -= delta
            j0 = j1
            if p[j0] == 0:
                break
        while j0 != 0:
            j1 = way[j0]
            p[j0] = p[j1]
            j0 = j1

    assignment = [0] * n
    for j in range(1, n + 1):
        assignment[p[j] - 1] = j - 1
    total = 0
    for i in range(n):
        total += cost[i][assignment[i]]
    return total, assignment


def main():
    tokens = sys.stdin.buffer.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    if n <= 0:
        sys.stdout.write("0\n\n")
        return
    cost = []
    index = 1
    for _ in range(n):
        row = [int(tokens[index + j]) for j in range(n)]
        index += n
        cost.append(row)
    total, assignment = hungarian(cost)
    sys.stdout.write(str(total) + "\n")
    sys.stdout.write(" ".join(str(column) for column in assignment) + "\n")


if __name__ == "__main__":
    main()
