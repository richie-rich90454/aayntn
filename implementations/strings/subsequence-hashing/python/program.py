"""String hashing of subsequences.

Input: one string s, a query count q, and q pairs of 0-based indices.
Output: SAME when deleting s[i] and deleting s[j] leave the same string,
DIFFERENT otherwise.

The hash of the string with s[i] deleted is the hash of the prefix before i
shifted by the length of the remaining suffix, plus the hash of the suffix
after i. Both pieces come from tables built once, so a query is constant time.
"""

import sys

BASE = 8000011
MOD = 90000049


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    s = data[0]
    n = len(s)

    power = [1] * (n + 1)
    for i in range(1, n + 1):
        power[i] = power[i - 1] * BASE % MOD

    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = (prefix[i] * BASE + s[i] - 96) % MOD

    suffix = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        suffix[i] = ((s[i] - 96) * power[n - 1 - i] + suffix[i + 1]) % MOD

    q = int(data[1])
    out = []
    at = 2
    for _ in range(q):
        i = int(data[at])
        j = int(data[at + 1])
        at += 2
        di = (prefix[i] * power[n - 1 - i] + suffix[i + 1]) % MOD
        dj = (prefix[j] * power[n - 1 - j] + suffix[j + 1]) % MOD
        out.append("SAME" if di == dj else "DIFFERENT")
    sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
