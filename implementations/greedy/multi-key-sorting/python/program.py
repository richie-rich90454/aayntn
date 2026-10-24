"""Reads records of three integer keys, sorts them by a ascending, then b
descending, then c ascending, and prints the sorted records.

Input: n, then n lines holding a, b and c.
Output: one line per record, with the three fields separated by single spaces.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n <= 0 or len(data) < 1 + 3 * n:
        return

    records = []
    index = 1
    for _ in range(n):
        records.append((int(data[index]), int(data[index + 1]), int(data[index + 2])))
        index += 3

    # The tuple is compared lexicographically: a ascending, then -b ascending
    # (which is b descending), then c ascending.
    records.sort(key=lambda r: (r[0], -r[1], r[2]))

    sys.stdout.write("\n".join(f"{a} {b} {c}" for a, b, c in records) + "\n")


if __name__ == "__main__":
    main()
