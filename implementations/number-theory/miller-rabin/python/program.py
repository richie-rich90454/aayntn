"""The Miller-Rabin primality test with the twelve deterministic 64-bit bases.

Input: t, then t non-negative integers below 2^63.
Output: one line per integer, holding PRIME or COMPOSITE.
"""

import sys

BASES = (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37)


def is_prime(n):
    """Whether n is prime, decided deterministically for 64-bit input."""
    if n < 2:
        return False

    # Small factors are cheap, and they leave n > 37 and coprime to every base.
    for p in BASES:
        if n % p == 0:
            return n == p

    # Write n - 1 as 2^s * d with d odd.
    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1

    for a in BASES:
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    count = int(data[0])
    out = []
    for token in data[1 : 1 + count]:
        value = int(token)
        out.append("PRIME\n" if is_prime(value) else "COMPOSITE\n")

    # Bytes keep the line feeds from becoming "\r\n" on Windows.
    sys.stdout.buffer.write("".join(out).encode())


if __name__ == "__main__":
    main()
