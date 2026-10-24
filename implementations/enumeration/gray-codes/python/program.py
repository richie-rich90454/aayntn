"""Print the binary reflected Gray code of n bits.

Input: one integer n.
Output: the 2^n n-bit codes, one per line, starting at zero.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    n = int(data[0])
    if n < 1 or n > 20:
        return

    lines = []
    for i in range(1 << n):
        gray = i ^ (i >> 1)
        lines.append(format(gray, f"0{n}b"))
    sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
