"""Euler's totient function driver.

Reads n, m and a, then prints phi(n) on the first line and a^phi(m) mod m on
the second. Python integers are arbitrary precision, so no product overflows.
"""

import sys


def phi(n):
    """Count the integers in [1, n] that are coprime to n."""
    result = n
    rest = n
    p = 2
    while p * p <= rest:
        if rest % p == 0:
            while rest % p == 0:
                rest //= p
            result -= result // p
        p += 1
    if rest > 1:
        result -= result // rest
    return result


def mod_pow(base, exponent, modulus):
    """Return base raised to exponent modulo modulus."""
    result = 1 % modulus
    base %= modulus
    while exponent > 0:
        if exponent & 1:
            result = result * base % modulus
        base = base * base % modulus
        exponent >>= 1
    return result


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 3:
        return
    n, m, a = (int(token) for token in data[:3])
    sys.stdout.write("{}\n".format(phi(n)))
    sys.stdout.write("{}\n".format(mod_pow(a, phi(m), m)))


if __name__ == "__main__":
    main()
