"""Reads n weights and a capacity, then prints the largest number of weights
whose total is at most the capacity.

Input: n and W, then n weights separated by whitespace.
Output: one line holding the count.
"""

import sys


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = int(data[0])
    capacity = int(data[1])
    weights = [int(token) for token in data[2 : 2 + n]]

    if n <= 0 or len(weights) < n:
        print(0)
        return

    weights.sort()

    used = 0
    count = 0
    for weight in weights:
        if weight > capacity - used:
            break
        used += weight
        count += 1

    print(count)


if __name__ == "__main__":
    main()
