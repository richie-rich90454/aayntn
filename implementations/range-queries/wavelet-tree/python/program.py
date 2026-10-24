"""A wavelet tree over a static array, stored level by level.

Every level keeps a prefix count of the elements that descend to the left
child, and the values are stable partitioned before the next level. A k-th
smallest query descends one level at a time.

Input: n q, then the n values, then q lines "l r k" with 0-based half-open
bounds [l, r). Output: one line per query, holding the k-th smallest value in
a[l..r).
"""

import sys


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 2:
        return

    n, q = data[0], data[1]
    if n <= 0:
        return

    values = data[2 : 2 + n]
    position = 2 + n

    sorted_values = sorted(set(values))
    rank_of = {value: rank for rank, value in enumerate(sorted_values)}
    distinct = len(sorted_values)
    bits = (distinct - 1).bit_length() if distinct > 1 else 0

    cur = [rank_of[value] for value in values]
    prefix = []
    zero_count = []
    for level in range(bits):
        shift = bits - 1 - level
        pref = [0] * (n + 1)
        zeros = 0
        for i, value in enumerate(cur):
            if ((value >> shift) & 1) == 0:
                zeros += 1
            pref[i + 1] = zeros
        prefix.append(pref)
        zero_count.append(zeros)

        next_level = [0] * n
        zero_position = 0
        one_position = zeros
        for value in cur:
            if ((value >> shift) & 1) == 0:
                next_level[zero_position] = value
                zero_position += 1
            else:
                next_level[one_position] = value
                one_position += 1
        cur = next_level

    answers = []
    for _ in range(q):
        left, right, k = data[position], data[position + 1], data[position + 2]
        position += 3

        rank = 0
        for level in range(bits):
            pref = prefix[level]
            zeros_left = pref[left]
            zeros_right = pref[right]
            zeros = zeros_right - zeros_left
            if k <= zeros:
                left, right = zeros_left, zeros_right
                rank <<= 1
            else:
                k -= zeros
                base = zero_count[level]
                left, right = base + (left - zeros_left), base + (right - zeros_right)
                rank = (rank << 1) | 1
        answers.append(str(sorted_values[rank]))

    if answers:
        sys.stdout.write("\n".join(answers) + "\n")


if __name__ == "__main__":
    main()
