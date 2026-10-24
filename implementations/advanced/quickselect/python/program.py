"""Deterministic quickselect over a signed 32-bit array.

The pivot is the median of the first, middle, and last value, and a three-way
partition removes every copy of it in one pass. Input: n, then n values, then
k. Output: the k-th smallest value.
"""

import sys


def median_of_three(a, lo, mid, hi):
    x = a[lo]
    y = a[mid]
    z = a[hi]
    if x > y:
        x, y = y, x
    if y > z:
        y, z = z, y
    if x > y:
        x, y = y, x
    return y


def select(a, k):
    lo = 0
    hi = len(a) - 1
    target = k - 1

    while lo < hi:
        mid = lo + (hi - lo) // 2
        pivot = median_of_three(a, lo, mid, hi)
        lt = lo
        i = lo
        gt = hi

        while i <= gt:
            if a[i] < pivot:
                a[lt], a[i] = a[i], a[lt]
                lt += 1
                i += 1
            elif a[i] > pivot:
                a[i], a[gt] = a[gt], a[i]
                gt -= 1
            else:
                i += 1

        if target < lt:
            hi = lt - 1
        elif target > gt:
            lo = gt + 1
        else:
            return pivot

    return a[lo]


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    index = 0
    n = int(data[index])
    index += 1
    if n <= 0 or index + n > len(data):
        return

    a = [int(value) for value in data[index : index + n]]
    index += n
    if index >= len(data):
        return

    k = int(data[index])
    if k < 1 or k > n:
        return

    sys.stdout.write(str(select(a, k)) + "\n")


if __name__ == "__main__":
    main()
