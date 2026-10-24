"""Reads n pairs of color and weight, then prints the maximum total weight of a
set that contains at most one item of each color.

Input: n, then n lines each holding a color and a weight.
Output: one line holding the total.
"""

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

    items = []
    index = 1
    for _ in range(n):
        color = int(data[index])
        weight = int(data[index + 1])
        index += 2
        items.append((color, weight))

    items.sort(key=lambda item: (item[0], -item[1]))

    total = 0
    previous = None
    for color, weight in items:
        if color != previous:
            total += weight
            previous = color

    print(total)


if __name__ == "__main__":
    main()
