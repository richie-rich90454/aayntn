"""The hook-length formula, driven from standard input.

Input: one integer k, then k non-increasing row lengths whose sum is n.
Output: the number of standard Young tableaux of the shape modulo 1000000007.
"""

import sys

MODULUS = 1000000007


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    k = data[0]
    if k < 0:
        return

    rows = data[1 : 1 + k]
    if len(rows) < k:
        return

    n = sum(rows)
    width = rows[0] if rows else 0
    heights = [0] * width
    for row in rows:
        for column in range(row):
            heights[column] += 1

    numerator = 1
    for value in range(2, n + 1):
        numerator = numerator * value % MODULUS

    denominator = 1
    for index, row in enumerate(rows):
        for column in range(row):
            hook = row - column + heights[column] - index - 1
            denominator = denominator * hook % MODULUS

    answer = numerator * pow(denominator, MODULUS - 2, MODULUS) % MODULUS
    sys.stdout.write(str(answer) + "\n")


if __name__ == "__main__":
    main()
