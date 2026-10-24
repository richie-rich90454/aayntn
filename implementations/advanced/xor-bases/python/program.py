"""XOR basis over 30 bits, driven from standard input.

Input: n, then n values, then q, then q query values. Output: for each query
x, the maximum of x XOR a subset XOR of the values.
"""

import sys

BITS = 30


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    index = 0
    n = int(data[index])
    index += 1
    basis = [0] * BITS
    for _ in range(n):
        value = int(data[index])
        index += 1
        for bit in range(BITS - 1, -1, -1):
            if not (value >> bit) & 1:
                continue
            if basis[bit]:
                value ^= basis[bit]
            else:
                basis[bit] = value
                break

    if index >= len(data):
        return
    q = int(data[index])
    index += 1
    out = []
    for _ in range(q):
        if index >= len(data):
            break
        x = int(data[index])
        index += 1
        for bit in range(BITS - 1, -1, -1):
            if basis[bit] and (x ^ basis[bit]) > x:
                x ^= basis[bit]
        out.append(str(x))

    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
