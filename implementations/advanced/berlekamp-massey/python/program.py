"""Berlekamp-Massey over the prime field modulo 1000000007.

The program reads a prefix of a sequence and prints the order of its shortest
linear recurrence and the next term.
"""

import sys

MODULO = 1_000_000_007


def power_mod(base: int, exponent: int) -> int:
    result = 1
    value = base % MODULO
    while exponent > 0:
        if exponent & 1:
            result = result * value % MODULO
        value = value * value % MODULO
        exponent >>= 1
    return result


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    if n <= 0 or len(data) < n + 1:
        return

    sequence = [value % MODULO for value in data[1 : n + 1]]
    current = [1]
    backup = [1]
    order = 0
    shift = 1
    last_discrepancy = 1

    for i in range(n):
        discrepancy = 0
        for j in range(min(order, i) + 1):
            discrepancy = (discrepancy + current[j] * sequence[i - j]) % MODULO
        if discrepancy == 0:
            shift += 1
            continue

        saved = current[:]
        coefficient = discrepancy * power_mod(last_discrepancy, MODULO - 2) % MODULO
        if len(current) < len(backup) + shift:
            current.extend([0] * (len(backup) + shift - len(current)))
        for j in range(len(backup)):
            current[j + shift] = (
                current[j + shift] - coefficient * backup[j]
            ) % MODULO

        if 2 * order <= i:
            order = i + 1 - order
            backup = saved
            last_discrepancy = discrepancy
            shift = 1
        else:
            shift += 1

    next_term = 0
    for j in range(1, min(order, n) + 1):
        next_term = (next_term + current[j] * sequence[n - j]) % MODULO
    next_term = (-next_term) % MODULO

    print(order, next_term)


if __name__ == "__main__":
    main()
