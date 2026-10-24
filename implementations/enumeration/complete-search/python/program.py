"""Count the subsets whose sum equals the target by trying every subset.

Input: n, then n integers, then the target.
Output: one line holding the count.
"""

import sys


def search(index, running, values, target):
    if index == len(values):
        return 1 if running == target else 0
    return search(index + 1, running, values, target) + search(
        index + 1, running + values[index], values, target
    )


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    n = int(data[0])
    values = [int(token) for token in data[1 : 1 + n]]
    target = int(data[1 + n])
    print(search(0, 0, values, target))


if __name__ == "__main__":
    main()
