"""Read the allowed moves and the heap sizes, then report the Grundy values."""

import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    position = 0
    k = max(0, int(data[position]))
    position += 1
    moves = [int(value) for value in data[position : position + k]]
    position += k

    if position >= len(data):
        return
    h = max(0, int(data[position]))
    position += 1
    heaps = [int(value) for value in data[position : position + h]]

    max_heap = max(heaps, default=0)
    grundy = [0] * (max_heap + 1)
    seen = [0] * (k + 2)

    for size in range(1, max_heap + 1):
        for move in moves:
            if move <= size:
                # The stamp size marks a value reachable from this heap size.
                seen[grundy[size - move]] = size
        value = 0
        while value <= k and seen[value] == size:
            value += 1
        grundy[size] = value

    lines = []
    total = 0
    for size in heaps:
        value = grundy[size]
        lines.append(str(value))
        total ^= value
    lines.append("first" if total else "second")
    sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
