"""Suffix tree of s + '$', built by inserting every suffix.

When two suffixes diverge inside an edge, the edge is split at the longest
common prefix. Every distinct substring of s is a locus on an edge of the tree
of s + '$' that does not contain the sentinel, so the total edge length minus
the number of suffixes counts the distinct substrings. The deepest internal
node is the longest repeated substring.
"""

import sys


def main() -> None:
    s = sys.stdin.buffer.readline().strip()
    t = s + b"$"
    N = len(t)
    cap = 2 * N + 2

    child = [-1] * (cap * 27)
    edge_start = [0] * cap
    edge_len = [0] * cap
    depth = [0] * cap
    child_count = [0] * cap

    size = 1
    for i in range(N):
        v = 0
        pos = i
        while True:
            c = 26 if t[pos] == 36 else t[pos] - 97
            u = child[v * 27 + c]
            if u == -1:
                u = size
                size += 1
                edge_start[u] = pos
                edge_len[u] = N - pos
                depth[u] = depth[v] + edge_len[u]
                child[v * 27 + c] = u
                child_count[v] += 1
                break

            max_len = min(edge_len[u], N - pos)
            l = 0
            while l < max_len and t[edge_start[u] + l] == t[pos + l]:
                l += 1

            if l == edge_len[u]:
                v = u
                pos += l
                if pos == N:
                    break
            else:
                w = size
                size += 1
                child[v * 27 + c] = w
                edge_start[w] = edge_start[u]
                edge_len[w] = l
                depth[w] = depth[v] + l

                code = 26 if t[edge_start[u] + l] == 36 else t[edge_start[u] + l] - 97
                child[w * 27 + code] = u
                child_count[w] += 1
                edge_start[u] += l
                edge_len[u] -= l

                leaf = size
                size += 1
                edge_start[leaf] = pos + l
                edge_len[leaf] = N - (pos + l)
                depth[leaf] = depth[w] + edge_len[leaf]
                code = 26 if t[pos + l] == 36 else t[pos + l] - 97
                child[w * 27 + code] = leaf
                child_count[w] += 1
                break

    total = 0
    best = 0
    for v in range(1, size):
        total += edge_len[v]
        if child_count[v] >= 2 and depth[v] > best:
            best = depth[v]

    sys.stdout.write(f"{total - N}\n{best}\n")


if __name__ == "__main__":
    main()
