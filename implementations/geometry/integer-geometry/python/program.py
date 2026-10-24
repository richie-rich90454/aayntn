"""Read a lattice polygon and print its three exact integer quantities.

The vertices are read in order, clockwise or counterclockwise. The output is
twice the area from the shoelace sum, the number of lattice points on the
boundary from a gcd per edge, and the number of interior lattice points from
Pick's theorem.
"""

import sys
from math import gcd


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 3 or len(data) < 1 + 2 * n:
        return

    points = []
    position = 1
    for _ in range(n):
        x = int(data[position])
        y = int(data[position + 1])
        points.append((x, y))
        position += 2

    twice_area = 0
    boundary = 0
    for i in range(n):
        ax, ay = points[i]
        bx, by = points[(i + 1) % n]
        twice_area += ax * by - bx * ay
        boundary += gcd(abs(bx - ax), abs(by - ay))

    twice_area = abs(twice_area)
    interior = (twice_area - boundary + 2) // 2

    sys.stdout.write(f"{twice_area}\n{boundary}\n{interior}\n")


if __name__ == "__main__":
    main()
