"""Read triples of integer points and print the exact orientation sign.

The sign is the sign of the cross product of B - A and C - A. The coordinates
have absolute value at most 10^6, so every product is at most 4 * 10^12 and
the cross product is at most 8 * 10^12. Python integers are unbounded, and the
bound keeps the width analysis identical to the other five languages.
"""

import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    q = int(data[0])
    if q <= 0 or len(data) < 1 + 6 * q:
        return

    out = []
    position = 1
    for _ in range(q):
        ax = int(data[position])
        ay = int(data[position + 1])
        bx = int(data[position + 2])
        by = int(data[position + 3])
        cx = int(data[position + 4])
        cy = int(data[position + 5])
        position += 6

        ux = bx - ax
        uy = by - ay
        vx = cx - ax
        vy = cy - ay
        d = ux * vy - uy * vx

        if d > 0:
            out.append("1")
        elif d < 0:
            out.append("-1")
        else:
            out.append("0")

    sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
