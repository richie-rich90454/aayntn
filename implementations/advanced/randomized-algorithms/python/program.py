"""Randomized quicksort with a three-way partition and a xorshift32 generator.

The generator is seeded with 2463534242 so that the six language variants take
the same pivots and report the same comparison count.
"""

import sys

MASK = 0xFFFFFFFF
rng_state = 2463534242
comparisons = 0


def next_random():
    global rng_state
    x = rng_state
    x ^= (x << 13) & MASK
    x ^= x >> 17
    x ^= (x << 5) & MASK
    rng_state = x & MASK
    return rng_state


def randomized_quicksort(a, lo, hi):
    global comparisons
    if lo >= hi:
        return

    pivot = a[lo + next_random() % (hi - lo + 1)]
    lt = lo
    i = lo
    gt = hi

    while i <= gt:
        comparisons += 1
        if a[i] < pivot:
            a[lt], a[i] = a[i], a[lt]
            lt += 1
            i += 1
        elif a[i] > pivot:
            a[i], a[gt] = a[gt], a[i]
            gt -= 1
        else:
            i += 1

    randomized_quicksort(a, lo, lt - 1)
    randomized_quicksort(a, gt + 1, hi)


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    if n <= 0:
        return

    a = data[1 : 1 + n]
    randomized_quicksort(a, 0, n - 1)
    sys.stdout.write(" ".join(map(str, a)) + "\n" + str(comparisons) + "\n")


main()
