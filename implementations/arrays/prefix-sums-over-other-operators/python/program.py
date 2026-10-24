"""Prefix products over a static array.

Reads n, the n array values, q and then q 1-based inclusive ranges from
standard input, and prints the product of each range modulo 1000000007.
The prefix table stores 1 in place of a zero, and a separate prefix table
counts the zeros, so a range is either zero or a quotient of two nonzero
prefix products.
"""

import sys

MODULO = 1000000007


def mod_power(base, exponent):
    """Return base raised to exponent modulo MODULO."""
    result = 1
    base %= MODULO
    while exponent > 0:
        if exponent & 1:
            result = result * base % MODULO
        base = base * base % MODULO
        exponent >>= 1
    return result


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    index = 0
    n = int(data[index])
    index += 1
    if n < 0:
        n = 0

    value = [0] * (n + 1)
    product = [1] * (n + 1)
    zeros = [0] * (n + 1)

    for i in range(1, n + 1):
        if index >= len(data):
            break
        x = int(data[index]) % MODULO
        index += 1
        value[i] = x
        zeros[i] = zeros[i - 1] + (1 if x == 0 else 0)
        product[i] = product[i - 1] * (1 if x == 0 else x) % MODULO

    inverse = [1] * (n + 1)
    inverse[n] = mod_power(product[n], MODULO - 2)
    for i in range(n, 0, -1):
        factor = 1 if value[i] == 0 else value[i]
        inverse[i - 1] = inverse[i] * factor % MODULO

    if index >= len(data):
        return
    q = int(data[index])
    index += 1
    if q < 0:
        q = 0

    lines = []
    for _ in range(q):
        if index + 1 >= len(data):
            break
        l = int(data[index])
        r = int(data[index + 1])
        index += 2
        if zeros[r] - zeros[l - 1] > 0:
            lines.append("0")
        else:
            lines.append(str(product[r] * inverse[l - 1] % MODULO))

    if lines:
        sys.stdout.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
