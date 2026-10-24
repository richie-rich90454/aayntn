"""The discrete logarithm by baby-step giant-step.

Input: q, then q lines holding a, b and m with gcd(a, m) = 1.
Output: the smallest non-negative x with a^x = b (mod m), or -1.
"""

import math
import sys


def discrete_log(a, b, m):
    """The smallest x with a^x = b (mod m), or -1 when no such x exists."""
    if b == 1:
        return 0

    n = math.isqrt(m)
    if n * n < m:
        n += 1

    # Baby steps: key b * a^q, keeping the largest q for a repeated key.
    table = {}
    cur = b % m
    for q in range(n):
        table[cur] = q
        cur = cur * a % m

    # Giant steps: a^(p * n), matched against the baby-step keys.
    stride = pow(a, n, m)
    cur = 1
    for p in range(1, n + 1):
        cur = cur * stride % m
        q = table.get(cur)
        if q is not None:
            return p * n - q

    return -1


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    count = int(data[0])
    out = []
    index = 1
    for _ in range(count):
        if index + 2 >= len(data):
            break
        a = int(data[index])
        b = int(data[index + 1])
        m = int(data[index + 2])
        index += 3
        out.append(f"{discrete_log(a, b, m)}\n")

    # Bytes keep the line feeds from becoming "\r\n" on Windows.
    sys.stdout.buffer.write("".join(out).encode())


if __name__ == "__main__":
    main()
