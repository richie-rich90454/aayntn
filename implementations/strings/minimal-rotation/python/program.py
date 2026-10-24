"""The minimal rotation of a string.

Input: one nonempty string without spaces, of length at most 10^6.
Output: the lexicographically smallest rotation of the string.

Two candidate start positions i and j advance through the string while k
counts the characters they agree on. When the candidates finally differ, the
loser and every start inside the matched block are eliminated at once, so each
character is compared a constant number of times.
"""

import sys


def least_rotation(s: str) -> int:
    n = len(s)
    i, j, k = 0, 1, 0
    while i < n and j < n and k < n:
        a = s[(i + k) % n]
        b = s[(j + k) % n]
        if a == b:
            k += 1
        elif a > b:
            i = i + k + 1
            if i <= j:
                i = j + 1
            k = 0
        else:
            j = j + k + 1
            if j <= i:
                j = i + 1
            k = 0
    return min(i, j)


def main() -> None:
    s = sys.stdin.readline().strip()
    n = len(s)
    if n == 0:
        sys.stdout.write("\n")
        return
    start = least_rotation(s)
    sys.stdout.write(s[start:] + s[:start] + "\n")


if __name__ == "__main__":
    main()
