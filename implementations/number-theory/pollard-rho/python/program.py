"""Pollard's rho with fixed constants x0 = 2 and c = 1, 2, 3, ... .

Input: t, then t positive integers below 2^63.
Output: one line per integer, holding its prime factors in ascending order.
"""

import sys
from math import gcd

SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]


def is_prime(n):
    if n < 2:
        return False

    for p in SMALL_PRIMES:
        if n % p == 0:
            return n == p

    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1

    for a in SMALL_PRIMES:
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        passed = False
        for _ in range(1, s):
            x = x * x % n
            if x == n - 1:
                passed = True
                break
        if not passed:
            return False
    return True


def rho_step(x, c, n):
    return (x * x + c) % n


def pollard(n):
    if n % 2 == 0:
        return 2
    if n % 3 == 0:
        return 3

    c = 1
    while True:
        x = 2
        y = 2
        d = 1
        while d == 1:
            x = rho_step(x, c, n)
            y = rho_step(rho_step(y, c, n), c, n)
            d = gcd(abs(x - y), n)
        if d != n:
            return d
        c += 1


def factorize(n):
    factors = []
    if n < 2:
        return factors

    for p in SMALL_PRIMES:
        while n % p == 0:
            factors.append(p)
            n //= p

    stack = [n] if n > 1 else []
    while stack:
        m = stack.pop()
        if is_prime(m):
            factors.append(m)
        else:
            d = pollard(m)
            stack.append(d)
            stack.append(m // d)

    factors.sort()
    return factors


def main():
    tokens = sys.stdin.buffer.read().split()
    if not tokens:
        return

    count = int(tokens[0])
    out = []
    for i in range(count):
        if i + 1 >= len(tokens):
            break
        out.append(" ".join(map(str, factorize(int(tokens[i + 1])))))

    data = "\n".join(out) + ("\n" if out else "")
    sys.stdout.buffer.write(data.encode("ascii"))


if __name__ == "__main__":
    main()
