"""The suffix-array-based palindrome method.

Input: one nonempty string of lowercase Latin letters, length at most 100000.
Output: the length of the longest palindromic substring and its first
0-based starting position, one per line.

The program builds the suffix array and the LCP array of s # reverse(s),
answers longest-common-prefix queries with a sparse table over the LCP
array, and binary searches the palindrome radius at every center.
"""

import sys
from array import array


def suffix_array(u):
    n = len(u)
    sa = list(range(n))
    cnt = [0] * max(n, 256)

    for ch in u:
        cnt[ch] += 1
    for i in range(1, 256):
        cnt[i] += cnt[i - 1]
    for i in range(n - 1, -1, -1):
        c = u[i]
        cnt[c] -= 1
        sa[cnt[c]] = i

    rank = [0] * n
    classes = 0
    rank[sa[0]] = 0
    for i in range(1, n):
        if u[sa[i]] != u[sa[i - 1]]:
            classes += 1
        rank[sa[i]] = classes

    k = 1
    while k < n and classes < n - 1:
        y = [0] * n
        p = 0
        for i in range(n - k, n):
            y[p] = i
            p += 1
        for i in range(n):
            if sa[i] >= k:
                y[p] = sa[i] - k
                p += 1

        cnt = [0] * (classes + 1)
        for i in range(n):
            cnt[rank[i]] += 1
        for i in range(1, classes + 1):
            cnt[i] += cnt[i - 1]
        for i in range(n - 1, -1, -1):
            v = y[i]
            cnt[rank[v]] -= 1
            sa[cnt[rank[v]]] = v

        old = rank
        rank = [0] * n
        classes = 0
        rank[sa[0]] = 0
        for i in range(1, n):
            a = sa[i - 1]
            b = sa[i]
            a2 = old[a + k] if a + k < n else -1
            b2 = old[b + k] if b + k < n else -1
            if old[a] != old[b] or a2 != b2:
                classes += 1
            rank[b] = classes
        k *= 2

    for i, p in enumerate(sa):
        rank[p] = i
    return sa, rank


def main():
    s = sys.stdin.buffer.read().strip()
    if not s:
        sys.stdout.write("0\n0\n")
        return

    n = len(s)
    u = s + b"#" + s[::-1]
    N = len(u)

    sa, rank = suffix_array(u)

    lcp = [0] * N
    h = 0
    for i in range(N):
        r = rank[i]
        if r == 0:
            h = 0
            continue
        j = sa[r - 1]
        while i + h < N and j + h < N and u[i + h] == u[j + h]:
            h += 1
        lcp[r] = h
        if h > 0:
            h -= 1

    lg = [0] * (N + 1)
    for i in range(2, N + 1):
        lg[i] = lg[i >> 1] + 1
    levels = lg[N] + 1
    st = [array("i", lcp)]
    for j in range(1, levels):
        span = 1 << (j - 1)
        limit = N - (1 << j) + 1
        prev = st[-1]
        cur = array("i", [0]) * N
        for i in range(limit):
            a = prev[i]
            b = prev[i + span]
            cur[i] = a if a < b else b
        st.append(cur)

    def lcp_query(i, j):
        if i == j:
            return N - i
        a = rank[i]
        b = rank[j]
        if a > b:
            a, b = b, a
        a += 1
        length = b - a + 1
        k = lg[length]
        x = st[k][a]
        y = st[k][b - (1 << k) + 1]
        return x if x < y else y

    best_len = 0
    best_start = 0

    for c in range(n):
        radius = min(c, n - 1 - c)
        lo, hi = 0, radius
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if lcp_query(c, 2 * n - c) >= mid + 1:
                lo = mid
            else:
                hi = mid - 1
        length = 2 * lo + 1
        start = c - lo
        if length > best_len or (length == best_len and start < best_start):
            best_len = length
            best_start = start

    for c in range(1, n):
        radius = min(c, n - c)
        lo, hi = 0, radius
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if lcp_query(c, 2 * n + 1 - c) >= mid:
                lo = mid
            else:
                hi = mid - 1
        length = 2 * lo
        start = c - lo
        if length > best_len or (length == best_len and start < best_start):
            best_len = length
            best_start = start

    sys.stdout.write(str(best_len) + "\n" + str(best_start) + "\n")


if __name__ == "__main__":
    main()
