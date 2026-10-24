"""Reads unit-time jobs with deadlines and profits, and prints the maximum
total profit of a set that can all finish by their deadlines.

Input: n, then n lines holding the deadline and the profit of one job.
Output: one line holding the maximum total profit.
"""

import heapq
import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n <= 0:
        print(0)
        return
    if len(data) < 1 + 2 * n:
        return

    jobs = []
    index = 1
    for _ in range(n):
        jobs.append((int(data[index]), int(data[index + 1])))
        index += 2

    jobs.sort()

    kept = []
    for deadline, profit in jobs:
        heapq.heappush(kept, profit)
        if len(kept) > deadline:
            heapq.heappop(kept)

    print(sum(kept))


if __name__ == "__main__":
    main()
