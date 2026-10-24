"""The suffix automaton of a string.

Input: one line holding a nonempty string of lowercase Latin letters.
Output: the number of distinct nonempty substrings, then the number of
occurrences of the lexicographically smallest nonempty substring.

The automaton is built online. Each prefix state receives one occurrence and
each clone receives zero; the counters are then pushed up the suffix links in
decreasing length order, which yields the size of every end-position set.
"""

import sys


def main() -> None:
    s = sys.stdin.buffer.readline().strip()
    n = len(s)
    if n == 0:
        sys.stdout.write("0\n0\n")
        return

    states = 2 * n + 2
    go = [-1] * (states * 26)
    max_len = [0] * states
    link = [0] * states
    count = [0] * states
    link[0] = -1

    size = 1
    last = 0
    for ch in s:
        c = ch - 97
        cur = size
        size += 1
        max_len[cur] = max_len[last] + 1
        count[cur] = 1

        p = last
        while p != -1 and go[p * 26 + c] == -1:
            go[p * 26 + c] = cur
            p = link[p]

        if p == -1:
            link[cur] = 0
        else:
            q = go[p * 26 + c]
            if max_len[p] + 1 == max_len[q]:
                link[cur] = q
            else:
                clone = size
                size += 1
                max_len[clone] = max_len[p] + 1
                go[clone * 26 : (clone + 1) * 26] = go[q * 26 : (q + 1) * 26]
                link[clone] = link[q]
                count[clone] = 0

                while p != -1 and go[p * 26 + c] == q:
                    go[p * 26 + c] = clone
                    p = link[p]
                link[q] = clone
                link[cur] = clone

        last = cur

    bucket = [0] * (n + 1)
    for v in range(1, size):
        bucket[max_len[v]] += 1
    for i in range(1, n + 1):
        bucket[i] += bucket[i - 1]

    order = [0] * (size - 1)
    for v in range(size - 1, 0, -1):
        bucket[max_len[v]] -= 1
        order[bucket[max_len[v]]] = v
    for i in range(size - 2, -1, -1):
        v = order[i]
        count[link[v]] += count[v]

    distinct = 0
    for v in range(1, size):
        distinct += max_len[v] - max_len[link[v]]

    smallest = min(s) - 97
    target = go[smallest]

    sys.stdout.write(f"{distinct}\n{count[target]}\n")


if __name__ == "__main__":
    main()
