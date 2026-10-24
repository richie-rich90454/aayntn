"""Mo's algorithm over a static array, driven from standard input.

Input: n q, then n signed integers, then q pairs "l r" with 1 <= l <= r <= n.
The maintained answer is the number of distinct values in the current window,
and the queries are answered in the order they appear in the input.
"""

import math
import sys


def main():
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
        return

    n = max(0, int(data[0]))
    q = max(0, int(data[1]))

    values = [int(token) for token in data[2 : 2 + n]]
    if len(values) < n:
        values.extend([0] * (n - len(values)))

    unique = sorted(set(values))
    rank_of = {value: index for index, value in enumerate(unique)}
    rank = [rank_of[value] for value in values]

    block = max(1, math.isqrt(n))

    offset = 2 + n
    queries = []
    for query_id in range(q):
        if offset + 1 >= len(data):
            break
        left = int(data[offset])
        right = int(data[offset + 1])
        offset += 2
        queries.append((left, right, query_id))

    queries.sort(
        key=lambda query: (
            (query[0] - 1) // block,
            query[1] if ((query[0] - 1) // block) % 2 == 0 else -query[1],
        )
    )

    frequency = [0] * len(unique)
    answers = [0] * q
    cur_left = 1
    cur_right = 0
    distinct = 0

    for left, right, query_id in queries:
        while cur_left > left:
            cur_left -= 1
            value = rank[cur_left - 1]
            if frequency[value] == 0:
                distinct += 1
            frequency[value] += 1
        while cur_right < right:
            cur_right += 1
            value = rank[cur_right - 1]
            if frequency[value] == 0:
                distinct += 1
            frequency[value] += 1
        while cur_left < left:
            value = rank[cur_left - 1]
            frequency[value] -= 1
            if frequency[value] == 0:
                distinct -= 1
            cur_left += 1
        while cur_right > right:
            value = rank[cur_right - 1]
            frequency[value] -= 1
            if frequency[value] == 0:
                distinct -= 1
            cur_right -= 1

        answers[query_id] = distinct

    if answers:
        sys.stdout.write("\n".join(str(answer) for answer in answers) + "\n")


if __name__ == "__main__":
    main()
