"""Count the tilings of an r x c grid with 1 x 2 and 2 x 1 dominoes.

Input: r c, then r strings of c characters. '0' is a free cell and '1' is
blocked.
Output: the number of ways to cover every free cell exactly once.

Before cell k the mask describes the next c cells: bit d is 1 when cell
k + d is already covered by a domino placed earlier. Bit 0 is cell k.
"""

import sys


def main():
    tokens = sys.stdin.buffer.read().split()
    if len(tokens) < 2:
        return

    r = int(tokens[0])
    c = int(tokens[1])
    if r <= 0 or c <= 0:
        print(1)
        return

    grid = [tokens[2 + i].decode() for i in range(r)]
    size = 1 << c
    dp = [0] * size
    dp[0] = 1

    for i in range(r):
        for j in range(c):
            k = i * c + j
            next_dp = [0] * size
            for mask, ways in enumerate(dp):
                if ways == 0:
                    continue
                base = mask >> 1

                if grid[i][j] == "1":
                    if (mask & 1) == 0:
                        next_dp[base] += ways
                elif (mask & 1) != 0:
                    next_dp[base] += ways
                else:
                    if j + 1 < c and grid[i][j + 1] == "0" and (mask & 2) == 0:
                        next_dp[base | 1] += ways
                    if i + 1 < r and grid[i + 1][j] == "0":
                        next_dp[base | (1 << (c - 1))] += ways
            dp = next_dp

    print(dp[0])


if __name__ == "__main__":
    main()
