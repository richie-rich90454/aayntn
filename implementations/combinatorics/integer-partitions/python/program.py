"""Euler's recurrence for the partition function, driven from standard input.

Input: one integer n. Output: p(n) modulo 1000000007.
"""

import sys

MODULUS = 1000000007


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0:
        return

    partitions = [0] * (n + 1)
    partitions[0] = 1

    for i in range(1, n + 1):
        total = 0
        k = 1
        while True:
            first = k * (3 * k - 1) // 2
            if first > i:
                break
            second = k * (3 * k + 1) // 2
            if k & 1:
                total += partitions[i - first]
                if total >= MODULUS:
                    total -= MODULUS
                if second <= i:
                    total += partitions[i - second]
                    if total >= MODULUS:
                        total -= MODULUS
            else:
                total -= partitions[i - first]
                if total < 0:
                    total += MODULUS
                if second <= i:
                    total -= partitions[i - second]
                    if total < 0:
                        total += MODULUS
            k += 1
        partitions[i] = total

    sys.stdout.write(str(partitions[n]) + "\n")


if __name__ == "__main__":
    main()
