"""Count the placements of n nonattacking queens and the visited nodes.

Input: one integer n.
Output: one line with the number of placements and the number of visited nodes.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    n = int(data[0])
    full = (1 << n) - 1
    count = 0
    nodes = 0

    def search(row, cols, down, anti):
        nonlocal count, nodes
        nodes += 1
        if row == n:
            count += 1
            return
        available = full & ~(cols | down | anti)
        while available:
            bit = available & -available
            available ^= bit
            search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >> 1)

    search(0, 0, 0, 0)
    print(count, nodes)


if __name__ == "__main__":
    main()
