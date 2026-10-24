"""Longest substring with at most k distinct characters.

The window is the longest mode of the state machine: push the next byte,
shrink while the distinct count is too large, then record the length.
"""

import sys


def longest_at_most_k(s: str, k: int) -> int:
    if k < 0:
        k = 0

    count: dict[str, int] = {}
    left = 0
    distinct = 0
    best = 0

    for right, char in enumerate(s):
        if count.get(char, 0) == 0:
            distinct += 1
        count[char] = count.get(char, 0) + 1

        while distinct > k:
            out = s[left]
            count[out] -= 1
            if count[out] == 0:
                distinct -= 1
            left += 1

        best = max(best, right - left + 1)

    return best


def main() -> None:
    tokens = sys.stdin.read().split()

    if not tokens:
        print(0)
        return

    s = tokens[0]
    k = int(tokens[1]) if len(tokens) > 1 else 0
    print(longest_at_most_k(s, k))


if __name__ == "__main__":
    main()
